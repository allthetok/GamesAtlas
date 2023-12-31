/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response } from 'express'
import axios from 'axios'
import { updateIGDBSearchConfig, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, updateIGDBSearchConfigMulti, getPlatformLogosIter, parseBody } from '../helpers/requests'
import { AgeRatings, ArtworkObj, Categories, Companies, Covers, Explore, LanguageObj, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SimilarObj, VideoObj, Videos, WebsiteObj } from '../helpers/betypes'
require('dotenv').config()
const router = express.Router()


router.post('/overview', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: OverviewObj = {
		id: null,
		age_ratings: '',
		cover: null,
		external_games: [],
		game_modes: '',
		genres: '',
		hypes: null,
		involved_companies: '',
		keywords: '' ,
		platforms: '',
		player_perspectives: '',
		tags: '',
		themes: '',
		websites: '',
		game_localizations: '',
		rating: null,
		ratingCount: null,
		releaseDate: null,
		likes: null,
		title: '',
		story: '',
		summary: '',
		url: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const searchterm = body.searchterm
	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings,category,cover,first_release_date,external_games,follows,game_modes,genres,hypes,involved_companies,keywords,name,platforms,player_perspectives,total_rating,total_rating_count,slug,storyline,summary,tags,themes,url,websites,game_localizations', '', '', true, searchterm, 1, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				id: searchResults.id,
				age_ratings: searchResults.age_ratings.join(','),
				cover: searchResults.cover,
				external_games: searchResults.external_games,
				game_modes: searchResults.game_modes.join(','),
				genres: searchResults.genres.join(','),
				hypes: searchResults.hypes,
				involved_companies: searchResults.involved_companies.join(','),
				keywords: searchResults.keywords.join(','),
				platforms: searchResults.platforms.join(','),
				player_perspectives: searchResults.player_perspectives.join(','),
				tags: searchResults.tags.join(','),
				themes: searchResults.themes.join(','),
				websites: searchResults.websites.join(','),
				game_localizations: searchResults.game_localizations.join(','),
				rating: searchResults.total_rating,
				ratingCount: searchResults.total_rating_count,
				releaseDate: new Date(searchResults.first_release_date*1000),
				likes: searchResults.follows,
				title: searchResults.name,
				story: searchResults.storyline,
				summary: searchResults.summary,
				url: searchResults.url
			}
		})
		.catch((err: any) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	//Catch and alter any fields (external_games, language_supports) to be split into multiple string arrays of 10 as IGDB limits each id=*string of ids* into a maximum of 10 ids searched at one time
	responseObj.external_games = splitIGDBSearch(responseObj.external_games)

	searchConfig = updateIGDBSearchConfig('age_ratings', 'category,rating', responseObj!.age_ratings, 'category=(1,2)', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let age_ratingsobj: AgeRatings = {
				'ESRB': response.data[0].rating,
				'PEGI': response.data[1].rating
			}
			responseObj.age_ratings = age_ratingsobj
		})
		.catch((err: any) => {
			console.log(err)
		})

	searchConfig = updateIGDBSearchConfig('covers', 'url', responseObj.cover, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			response.data[0].url = response.data[0].url.replace('thumb', 'cover_big')
			responseObj.cover = `https:${response.data[0].url}`
		})
		.catch((err: any) => {
			console.log(err)
		})
	responseObj.external_games = await getExternalGamesIter(responseObj.external_games)

	searchConfig = updateIGDBSearchConfig('game_modes', 'name', responseObj.game_modes, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfGameModes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfGameModes.push(searchResults[i].name)
			}
			responseObj.game_modes = arrOfGameModes
		})
		.catch((err: any) => {
			console.log(err)
		})


	searchConfig = updateIGDBSearchConfig('genres', 'name', responseObj.genres, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfGenres: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfGenres.push(searchResults[i].name)
			}
			responseObj.genres = arrOfGenres
		})
		.catch((err: any) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('involved_companies', 'company', responseObj.involved_companies, '', false, '', 0, '')
	let idofCompanies = ''
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				if (i === searchResults.length - 1) {
					idofCompanies = idofCompanies.concat(searchResults[i].company)
				}
				else {
					idofCompanies = idofCompanies.concat(`${searchResults[i].company},`)
				}
			}
		})
		.catch((err: any) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('companies', 'name,logo', idofCompanies, '', false, '', 0, '')
	let arrOfCompanies: Companies[] = []
	let logoids = ''
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfCompanies.push({
					name: searchResults[i].name,
					// logoid: searchResults[i].logo,
					officialSite: '',
					url: ''
				})
				if (i === searchResults.length - 1) {
					logoids = logoids.concat(searchResults[i].logo)
				}
				else {
					logoids = logoids.concat(`${searchResults[i].logo},`)
				}
			}
		})

	searchConfig = updateIGDBSearchConfig('company_logos', 'url', logoids, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				// let objIndex = arrOfCompanies.findIndex((obj => obj.logoid === searchResults[i].id))
				let objIndex = arrOfCompanies.findIndex((obj => obj.officialSite === searchResults[i].id))
				let oldValAtIndex = arrOfCompanies[objIndex]
				arrOfCompanies[objIndex] = {
					...oldValAtIndex,
					url: `https:${searchResults[i].url}`
				}
			}
			responseObj.involved_companies = arrOfCompanies
		})


	searchConfig = updateIGDBSearchConfig('keywords', 'name', responseObj.keywords, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfKeywords: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfKeywords.push(searchResults[i].name)
			}
			responseObj.keywords = arrOfKeywords
		})
		.catch((err: any) => {
			console.log(err)

		})

	let arrOfPlatforms: Platforms[] = []
	let platformlogoids = ''

	searchConfig = updateIGDBSearchConfig('platforms', 'name,category,platform_logo', responseObj.platforms, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfPlatforms.push({
					name: searchResults[i].name,
					category: searchResults[i].category,
					// platform_logo: searchResults[i].platform_logo,
					url: '',
					id: searchResults[i].id,
					platform_family: 0
				})
				if (i === searchResults.length - 1) {
					platformlogoids = platformlogoids.concat(searchResults[i].platform_logo)
				}
				else {
					platformlogoids = platformlogoids.concat(`${searchResults[i].platform_logo},`)
				}
			}
		})
		.catch((err: any) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogoids, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				// let objIndex = arrOfPlatforms.findIndex((obj => obj.platform_logo === searchResults[i].id))
				let objIndex = arrOfPlatforms.findIndex((obj => obj.id === searchResults[i].id))
				let oldValAtIndex = arrOfPlatforms[objIndex]
				arrOfPlatforms[objIndex] = {
					...oldValAtIndex,
					url: `https:${searchResults[i].url}`
				}
			}
			responseObj.platforms = arrOfPlatforms
		})

	searchConfig = updateIGDBSearchConfig('player_perspectives', 'name', responseObj.player_perspectives, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfPerspectives: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfPerspectives.push(searchResults[i].name)
			}
			responseObj.player_perspectives = arrOfPerspectives
		})
		.catch((err: any) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('themes', 'name', responseObj.themes, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfThemes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfThemes.push(searchResults[i].name)
			}
			responseObj.themes = arrOfThemes
		})

	searchConfig = updateIGDBSearchConfig('websites', 'category,url', responseObj.websites, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfSites: Categories[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfSites.push({
					category: searchResults[i].category,
					url: searchResults[i].url
				})
			}
			responseObj.websites = arrOfSites
		})
		.catch((err: any) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('game_localizations', 'name', responseObj.game_localizations, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj.game_localizations = searchResults.name
		})
		.catch((err: any) => {
			console.log(err)

		})

	return response.status(200).json(responseObj)
})

router.post('/artwork', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: ArtworkObj = {
		artworks: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'artworks', gameid, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				artworks: searchResults.artworks.join(',')
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('artworks', 'url', responseObj.artworks, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfImages: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfImages.push(`https:${searchResults[i].url}`)
			}
			responseObj.artworks = arrOfImages
		})
		.catch((err: any) => {
			console.log(err)
		})
	return response.status(200).json(responseObj)
})

router.post('/language', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: LanguageObj = {
		language_supports: []
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'language_supports', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				language_supports: searchResults.language_supports
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	responseObj.language_supports = splitIGDBSearch(responseObj.language_supports.map(String))
	responseObj.language_supports = await getLanguagesIter(responseObj.language_supports)

	return response.status(200).json(responseObj)
})

router.post('/screenshots', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: ScreenshotsObj = {
		screenshots: []
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'screenshots', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				screenshots: searchResults.screenshots.join(',')
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('screenshots', 'url', responseObj.screenshots, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfScreenshots: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfScreenshots.push(`https:${searchResults[i].url}`)
			}
			responseObj.screenshots = arrOfScreenshots
		})
		.catch((err: any) => {
			console.log(err)

		})

	return response.status(200).json(responseObj)
})

router.post('/similargames', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: SimilarObj = {
		similar_games: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	let arrOfSimilarGames: Covers[] = []
	let coverids: string
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'similar_games', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				similar_games: searchResults.similar_games.join(',')
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('games', 'name,cover', responseObj.similar_games, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				arrOfSimilarGames.push(
					{
						name: searchResults[i].name,
						cover: searchResults[i].cover
					}
				)
			}
			responseObj.similar_games = arrOfSimilarGames
		})
	coverids = arrOfSimilarGames.map((cov) => cov.cover).join(',')
	//get cover url's of each similar game
	searchConfig = updateIGDBSearchConfig('covers', 'url', coverids, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			searchResults = searchResults.map((cov: any) => {
				return { ...cov, url: cov.url.replace('thumb', 'cover_big') }
			})
			for (let i = 0; i < searchResults.length; i++) {
				const covIndex: number = arrOfSimilarGames.findIndex((cov) => cov.cover === searchResults[i].id)
				let oldValAtIndex = arrOfSimilarGames[covIndex]
				arrOfSimilarGames[covIndex] = {
					...oldValAtIndex,
					cover: `https:${searchResults[i].url}`
				}
			}
			responseObj.similar_games = arrOfSimilarGames
		})
		.catch((err: any) => {
			console.log(err)
		})

	return response.status(200).json(responseObj)
})

router.post('/videos', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: VideoObj = {
		videos: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'videos', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				videos: searchResults.videos.join(',')
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('game_videos', 'name,video_id', responseObj.videos, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfVideos: Videos[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfVideos.push({
					name: searchResults[i].name,
					ytlink: searchResults[i].video_id
				})
			}
			responseObj.videos = arrOfVideos
		})
		.catch((err: any) => {
			console.log(err)
		})

	return response.status(200).json(responseObj)
})

router.post('/websites', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: WebsiteObj = {
		websites: ''
	}
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid
	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'websites', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data[0]
			responseObj = {
				websites: searchResults.websites.join(',')
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('websites', 'category,url', responseObj.websites, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			let arrOfSites: Categories[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfSites.push({
					category: searchResults[i].category,
					url: searchResults[i].url
				})
			}
			responseObj.websites = arrOfSites
		})
		.catch((err: any) => {
			console.log(err)

		})
	return response.status(200).json(responseObj)
})

router.post('/explore', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []
	let indResponseObj: Explore
	const sortBy = body.sortBy
	const externalFilter = body.externalFilter
	const limit = body.limit

	if (sortBy === null || sortBy === '' || !sortBy) {
		return response.status(400).json({
			error: `No direction and sort specified: ${sortBy}`
		})
	}
	else if (externalFilter === null || externalFilter === '' || !externalFilter) {
		return response.status(400).json({
			error: `No filter specified: ${externalFilter}`
		})
	}
	else if (limit === null || limit === 0 || !limit) {
		return response.status(400).json({
			error: `No limit specified or limit equal to: ${limit}`
		})
	}


	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings,cover,first_release_date,follows,name,platforms,total_rating,total_rating_count', '', externalFilter, false, '', limit, sortBy)
	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data
			for (let i = 0; i < searchResults.length; i++) {
				let otherSearchResults: any

				indResponseObj = {
					id: searchResults[i].id,
					age_ratings: searchResults[i].age_ratings.join(','),
					cover: searchResults[i].cover,
					platforms: searchResults[i].platforms.join(','),
					rating: searchResults[i].total_rating,
					ratingCount: searchResults[i].total_rating_count,
					releaseDate: new Date(searchResults[i].first_release_date*1000),
					likes: searchResults[i].follows,
					title: searchResults[i].name,
					genres: [],
					involved_companies: []
				}


				searchConfig = updateIGDBSearchConfig('age_ratings', 'category,rating', indResponseObj!.age_ratings, 'category=(1,2)', false, '', 0, '')
				await axios(searchConfig)
					.then((response: any) => {
						otherSearchResults = response.data
						let age_ratingsobj: AgeRatings = {
							'ESRB': response.data[0].rating,
							'PEGI': response.data[1].rating
						}
						indResponseObj.age_ratings = age_ratingsobj
					})
					.catch((err: any) => {
						console.log(err)
					})

				searchConfig = updateIGDBSearchConfig('covers', 'url', indResponseObj.cover, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response: any) => {
						otherSearchResults = response.data
						response.data[0].url = response.data[0].url.replace('thumb', 'cover_big')
						indResponseObj.cover = `https:${response.data[0].url}`
					})
					.catch((err: any) => {
						console.log(err)
					})

				let arrOfPlatforms: Platforms[] = []
				let platformlogoids = ''
				searchConfig = updateIGDBSearchConfig('platforms', 'name,category,platform_logo', indResponseObj.platforms, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response: any) => {
						otherSearchResults = response.data
						for (let i = 0; i < otherSearchResults.length; i++) {
							arrOfPlatforms.push({
								name: otherSearchResults[i].name,
								category: otherSearchResults[i].category,
								// platform_logo: otherSearchResults[i].platform_logo,
								url: '',
								id: otherSearchResults[i].id,
								platform_family: 0
							})
							if (i === otherSearchResults.length - 1) {
								platformlogoids = platformlogoids.concat(otherSearchResults[i].platform_logo)
							}
							else {
								platformlogoids = platformlogoids.concat(`${otherSearchResults[i].platform_logo},`)
							}
						}
					})
					.catch((err: any) => {
						console.log(err)
					})

				searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogoids, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response: any) => {
						otherSearchResults = response.data
						for (let i = 0; i < otherSearchResults.length; i++) {
							// let objIndex = arrOfPlatforms.findIndex((obj => obj.platform_logo === otherSearchResults[i].id))
							let objIndex = arrOfPlatforms.findIndex((obj => obj.id === otherSearchResults[i].id))
							let oldValAtIndex = arrOfPlatforms[objIndex]
							arrOfPlatforms[objIndex] = {
								...oldValAtIndex,
								url: `https:${otherSearchResults[i].url}`
							}
						}
						indResponseObj.platforms = arrOfPlatforms
					})
					.catch((err: any) => {
						console.log(err)
					})
				responseObj.push(indResponseObj)
			}
		})
		.catch((err: any) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	return response.status(200).json(responseObj)
})

router.post('/exploreplatformlogos', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let logoSet: Set<number> = new Set<number>()
	let allPlatforms: any
	let arrOfPlatforms: Platforms[] = []
	let arrayofUniqueLogos: string[] = []
	let responseObj: Explore[] = []
	let indResponseObj: Explore



	if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
		return response.status(400).json({
			error: `No direction and sort specified: ${body.sortBy}`
		})
	}
	else if (body.externalFilter === null || body.externalFilter === '' || !body.externalFilter) {
		return response.status(400).json({
			error: `No filter specified: ${body.sortBy}`
		})
	}
	else if (body.limit === null || body.limit === 0 || !body.limit) {
		return response.status(400).json({
			error: `No limit specified or limit equal to: ${body.limit}`
		})
	}
	else if (body.sortDirection === null || body.sortDirection === '' || !body.sortDirection) {
		return response.status(400).json({
			error: `No limit specified or limit equal to: ${body.limit}`
		})
	}

	const { externalFilter, platformFamily, limit, sortBy } = parseBody(body)
	searchConfig = updateIGDBSearchConfigMulti('multiquery','id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count, genres.name, involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', externalFilter, platformFamily, limit, sortBy)
	console.log(searchConfig)
	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data[0].result
			for (let i = 0; i < searchResults.length; i++) {
				let platformlogoids = ''
				indResponseObj = {
					id: searchResults[i].id,
					age_ratings: searchResults[i].age_ratings !== undefined ? searchResults[i].age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
					cover: `https:${searchResults[i].cover.url.replace('thumb', '1080p')}`,
					platforms: searchResults[i].platforms.map((indPlatform: any) => ({
						name: indPlatform.name,
						category: indPlatform.category,
						url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
						id: indPlatform.id,
						platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
					})),
					rating: searchResults[i].total_rating,
					ratingCount: searchResults[i].total_rating_count,
					releaseDate: searchResults[i].first_release_date ? new Date(searchResults[i].first_release_date*1000) : 'N/A',
					likes: searchResults[i].follows,
					title: searchResults[i].name,
					genres: searchResults[i].genres,
					involved_companies: searchResults[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
						name: indCompany.company.name,
						url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
						officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : '' }))
				}

				allPlatforms = indResponseObj.platforms.map((platform: any) => platform.platform_logo)
				for (let k = 0; k < allPlatforms.length; k++) {
					if (allPlatforms[k] > 0) {
						logoSet.add(allPlatforms[k])
					}
				}

				const ageRatingsobj: AgeRatings = {
					'ESRB': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1)[0].rating : 0,
					'PEGI': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2)[0].rating : 0
				}
				indResponseObj.age_ratings = ageRatingsobj

				for (let j = 0; j < indResponseObj.platforms.length; j++) {
					// if (indResponseObj.platforms[j].platform_logo > 0 ) {
					// 	arrOfPlatforms.push({
					// 		name: indResponseObj.platforms[j].name,
					// 		category: indResponseObj.platforms[j].category,
					// 		platform_logo: indResponseObj.platforms[j].platform_logo,
					// 		url: ''
					// 	})
					// }
					if (indResponseObj.platforms[j].id > 0) {
						arrOfPlatforms.push({
							name: indResponseObj.platforms[j].name,
							category: indResponseObj.platforms[j].category,
							// platform_logo: '',
							id: indResponseObj.platforms[j].id,
							platform_family: 0,
							url: ''
						})
					}
				}
				platformlogoids = arrOfPlatforms.map((platform: any) => platform.platform_logo).join(',')
				responseObj.push(indResponseObj)
			}
		})
		.catch((err: any) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve filtered set of games when sorting on: ${body.sortBy} with direction ${body.sortDirection}, external filter ${body.externalFilter}, with limit ${body.limit} `
		})
	}


	if (logoSet.size >= 10) {
		arrayofUniqueLogos = splitIGDBSearch([...logoSet])
	}
	else {
		arrayofUniqueLogos.push([...logoSet].join(','))
	}
	let arrOfPlatformLogos: any[] = await getPlatformLogosIter(arrayofUniqueLogos)
	for (let i = 0; i < responseObj.length; i++) {
		let editResponseObj = responseObj[i]
		let arrofPlatformsInd = editResponseObj.platforms
		for (let j = 0; j < arrofPlatformsInd.length; j++) {
			let originalPlatformVal = arrofPlatformsInd[j]
			// let platformurl: string = arrOfPlatformLogos.filter((platform: any) => platform.id === originalPlatformVal.platform_logo).length !== 0 ? arrOfPlatformLogos.filter((platform: any) => platform.id === originalPlatformVal.platform_logo)[0].url : ''
			let platformurl: string = arrOfPlatformLogos.filter((platform: any) => platform.id === originalPlatformVal.platform_family).length !== 0 ? arrOfPlatformLogos.filter((platform: any) => platform.id === originalPlatformVal.platform_family)[0].url : ''

			arrofPlatformsInd[j] = {
				...originalPlatformVal,
				url: platformurl
			}
		}
		responseObj[i].platforms = arrofPlatformsInd
	}
	return response.status(200).json(responseObj)
})

export { router }