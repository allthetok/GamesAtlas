/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { requestLogger, corsOptions, updateIGDBSearchConfig, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, updateIGDBSearchConfigMulti, getPlatformLogosIter, platformFamilyQuerified, parseBody, populateSimilarGames, categoriesCheck, errorHandleMiddleware } from '../helpers/requests'
import { AgeRatings, ArtworkObj, Categories, Companies, Covers, Explore, GameDetailObj, GameObj, GlobalAuxiliaryObj, LanguageObj, Languages, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SimilarGamesObj, SimilarObj, VideoObj, Videos, WebsiteObj } from '../helpers/betypes'
import { ExternalCategories, WebsiteCategories, placeholderImages } from '../../frontendga/assets/ratingsvglinks'
require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import axios from 'axios'
import cors from 'cors'
import pg, { QueryResult } from 'pg'
import bcrypt from 'bcrypt'
import { sortMap, platformMap, genreMap, categoryMap } from '../helpers/enums'
const app = express()

app.use(express.json())
app.use(requestLogger)
app.use(cors(corsOptions))

app.post('/api/deprecated/overview', async (request: Request, response: Response) => {
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
		.then((response) => {
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
		.catch((err) => {
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
		.then((response) => {
			searchResults = response.data
			let age_ratingsobj: AgeRatings = {
				'ESRB': response.data[0].rating,
				'PEGI': response.data[1].rating
			}
			responseObj.age_ratings = age_ratingsobj
		})
		.catch((err) => {
			console.log(err)
		})

	searchConfig = updateIGDBSearchConfig('covers', 'url', responseObj.cover, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			response.data[0].url = response.data[0].url.replace('thumb', 'cover_big')
			responseObj.cover = `https:${response.data[0].url}`
		})
		.catch((err) => {
			console.log(err)
		})
	responseObj.external_games = await getExternalGamesIter(responseObj.external_games)

	searchConfig = updateIGDBSearchConfig('game_modes', 'name', responseObj.game_modes, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfGameModes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfGameModes.push(searchResults[i].name)
			}
			responseObj.game_modes = arrOfGameModes
		})
		.catch((err) => {
			console.log(err)
		})


	searchConfig = updateIGDBSearchConfig('genres', 'name', responseObj.genres, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfGenres: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfGenres.push(searchResults[i].name)
			}
			responseObj.genres = arrOfGenres
		})
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('involved_companies', 'company', responseObj.involved_companies, '', false, '', 0, '')
	let idofCompanies = ''
	await axios(searchConfig)
		.then((response) => {
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
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('companies', 'name,logo', idofCompanies, '', false, '', 0, '')
	let arrOfCompanies: Companies[] = []
	let logoids = ''
	await axios(searchConfig)
		.then((response) => {
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
		.then((response) => {
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
		.then((response) => {
			searchResults = response.data
			let arrOfKeywords: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfKeywords.push(searchResults[i].name)
			}
			responseObj.keywords = arrOfKeywords
		})
		.catch((err) => {
			console.log(err)

		})

	let arrOfPlatforms: Platforms[] = []
	let platformlogoids = ''

	searchConfig = updateIGDBSearchConfig('platforms', 'name,category,platform_logo', responseObj.platforms, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
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
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogoids, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
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
		.then((response) => {
			searchResults = response.data
			let arrOfPerspectives: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfPerspectives.push(searchResults[i].name)
			}
			responseObj.player_perspectives = arrOfPerspectives
		})
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('themes', 'name', responseObj.themes, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfThemes: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				arrOfThemes.push(searchResults[i].name)
			}
			responseObj.themes = arrOfThemes
		})

	searchConfig = updateIGDBSearchConfig('websites', 'category,url', responseObj.websites, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
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
		.catch((err) => {
			console.log(err)

		})

	searchConfig = updateIGDBSearchConfig('game_localizations', 'name', responseObj.game_localizations, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj.game_localizations = searchResults.name
		})
		.catch((err) => {
			console.log(err)

		})

	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/artwork', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				artworks: searchResults.artworks.join(',')
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('artworks', 'url', responseObj.artworks, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfImages: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfImages.push(`https:${searchResults[i].url}`)
			}
			responseObj.artworks = arrOfImages
		})
		.catch((err) => {
			console.log(err)
		})
	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/language', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				language_supports: searchResults.language_supports
			}
		})
		.catch((err) => {
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

app.post('/api/deprecated/screenshots', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				screenshots: searchResults.screenshots.join(',')
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('screenshots', 'url', responseObj.screenshots, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			let arrOfScreenshots: string[] = []
			for (let i = 0; i < searchResults.length; i++) {
				searchResults[i].url = searchResults[i].url.replace('thumb', '1080p')
				arrOfScreenshots.push(`https:${searchResults[i].url}`)
			}
			responseObj.screenshots = arrOfScreenshots
		})
		.catch((err) => {
			console.log(err)

		})

	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/similargames', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				similar_games: searchResults.similar_games.join(',')
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('games', 'name,cover', responseObj.similar_games, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
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
		.then((response) => {
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
		.catch((err) => {
			console.log(err)
		})

	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/videos', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				videos: searchResults.videos.join(',')
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('game_videos', 'name,video_id', responseObj.videos, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response) => {
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
		.catch((err) => {
			console.log(err)
		})

	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/websites', async (request: Request, response: Response) => {
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
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				websites: searchResults.websites.join(',')
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	searchConfig = updateIGDBSearchConfig('websites', 'category,url', responseObj.websites, '', false, '', 0, '')

	await axios(searchConfig)
		.then((response) => {
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
		.catch((err) => {
			console.log(err)

		})
	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/explore', async (request: Request, response: Response) => {
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
		.then(async (response) => {
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
					.then((response) => {
						otherSearchResults = response.data
						let age_ratingsobj: AgeRatings = {
							'ESRB': response.data[0].rating,
							'PEGI': response.data[1].rating
						}
						indResponseObj.age_ratings = age_ratingsobj
					})
					.catch((err) => {
						console.log(err)
					})

				searchConfig = updateIGDBSearchConfig('covers', 'url', indResponseObj.cover, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response) => {
						otherSearchResults = response.data
						response.data[0].url = response.data[0].url.replace('thumb', 'cover_big')
						indResponseObj.cover = `https:${response.data[0].url}`
					})
					.catch((err) => {
						console.log(err)
					})

				let arrOfPlatforms: Platforms[] = []
				let platformlogoids = ''
				searchConfig = updateIGDBSearchConfig('platforms', 'name,category,platform_logo', indResponseObj.platforms, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response) => {
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
					.catch((err) => {
						console.log(err)
					})

				searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogoids, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response) => {
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
					.catch((err) => {
						console.log(err)
					})
				responseObj.push(indResponseObj)
			}
		})
		.catch((err) => {
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}

	return response.status(200).json(responseObj)
})

app.post('/api/deprecated/exploreplatformlogos', async (request: Request, response: Response) => {
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
		.then(async (response) => {
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
		.catch((err) => {
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

app.use('/api/explore', (request: Request, response: Response, next: NextFunction) => {
	const body = request.body
	// console.log(request.baseUrl.replace('/api/',''))

	errorHandleMiddleware(request.baseUrl, body, response)
	next()
})

app.use('/api/explore', async (request: Request, response: Response, next: NextFunction) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []
	let indResponseObj: Explore
	const { externalFilter, platformFamily, limit, sortBy } = parseBody(body)

	searchConfig = updateIGDBSearchConfigMulti('multiquery','id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count, genres.name, involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', externalFilter, platformFamily, limit, sortBy)
	// console.log(searchConfig)
	await axios(searchConfig)
		.then(async (response) => {
			searchResults = response.data[0].result
			for (let i = 0; i < searchResults.length; i++) {
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

				const ageRatingsobj: AgeRatings = {
					'ESRB': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1)[0].rating : 0,
					'PEGI': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2)[0].rating : 0
				}
				indResponseObj.age_ratings = ageRatingsobj
				responseObj.push(indResponseObj)
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve filtered set of games when sorting on: ${body.sortBy} with direction ${body.sortDirection}, external filter ${body.externalFilter}, with limit ${body.limit} `
		})
	}
	response.json(responseObj)
	next()
})


app.post('/api/explore', async (request: Request, response: Response, next: NextFunction) => {
	// const body = request.body
	// let searchResults: any
	// let errSearch = false
	// let searchConfig: SearchConfig
	// let responseObj: Explore[] = []
	// let indResponseObj: Explore

	// if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
	// 	return response.status(400).json({
	// 		error: `No direction and sort specified: ${body.sortBy}`
	// 	})
	// }
	// else if (body.externalFilter === null || body.externalFilter === '' || !body.externalFilter) {
	// 	return response.status(400).json({
	// 		error: `No filter specified: ${body.sortBy}`
	// 	})
	// }
	// else if (body.limit === null || body.limit === 0 || !body.limit) {
	// 	return response.status(400).json({
	// 		error: `No limit specified or limit equal to: ${body.limit}`
	// 	})
	// }
	// else if (body.sortDirection === null || body.sortDirection === '' || !body.sortDirection) {
	// 	return response.status(400).json({
	// 		error: `No limit specified or limit equal to: ${body.limit}`
	// 	})
	// }

	// const { externalFilter, platformFamily, limit, sortBy } = parseBody(body)

	// searchConfig = updateIGDBSearchConfigMulti('multiquery','id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count, genres.name, involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', externalFilter, platformFamily, limit, sortBy)
	// //console.log(searchConfig)
	// await axios(searchConfig)
	// 	.then(async (response) => {
	// 		searchResults = response.data[0].result
	// 		for (let i = 0; i < searchResults.length; i++) {
	// 			indResponseObj = {
	// 				id: searchResults[i].id,
	// 				age_ratings: searchResults[i].age_ratings !== undefined ? searchResults[i].age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
	// 				cover: `https:${searchResults[i].cover.url.replace('thumb', '1080p')}`,
	// 				platforms: searchResults[i].platforms.map((indPlatform: any) => ({
	// 					name: indPlatform.name,
	// 					category: indPlatform.category,
	// 					url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
	// 					id: indPlatform.id,
	// 					platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
	// 				})),
	// 				rating: searchResults[i].total_rating,
	// 				ratingCount: searchResults[i].total_rating_count,
	// 				releaseDate: searchResults[i].first_release_date ? new Date(searchResults[i].first_release_date*1000) : 'N/A',
	// 				likes: searchResults[i].follows,
	// 				title: searchResults[i].name,
	// 				genres: searchResults[i].genres,
	// 				involved_companies: searchResults[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
	// 					name: indCompany.company.name,
	// 					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
	// 					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : '' }))
	// 			}

	// 			const ageRatingsobj: AgeRatings = {
	// 				'ESRB': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1)[0].rating : 0,
	// 				'PEGI': indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2).length !== 0 ? indResponseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2)[0].rating : 0
	// 			}
	// 			indResponseObj.age_ratings = ageRatingsobj
	// 			responseObj.push(indResponseObj)
	// 		}
	// 	})
	// 	.catch((err) => {
	// 		errSearch = true
	// 		console.log(err)
	// 	})
	// if (errSearch) {
	// 	return response.status(404).json({
	// 		Message: `Unable to retrieve filtered set of games when sorting on: ${body.sortBy} with direction ${body.sortDirection}, external filter ${body.externalFilter}, with limit ${body.limit} `
	// 	})
	// }
	// return response.status(200).json(responseObj)
	return response.status(200)
})


app.post('/api/overview', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: GameObj
	let errSearch = false
	let searchConfig: SearchConfig
	let searchterm = body.searchterm.replace('+', ' ')
	// searchterm = searchterm.replace('%', ':')
	// console.log(searchterm)

	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}
	//Original without category filter
	// searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,artworks.url,category,cover.url,first_release_date,external_games.category,external_games.url,follows,game_modes.name,genres.name,hypes,involved_companies,keywords.name,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,player_perspectives.name,total_rating,total_rating_count,screenshots.url,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,slug,storyline,summary,tags,themes.name,url,videos.name,videos.video_id,websites.game,websites.category,websites.url,language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,game_localizations.name,game_localizations.region.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', '', '', true, searchterm, 1, '')
	//check that category = 0: Main Game not a DLC
	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,artworks.url,category,cover.url,first_release_date,external_games.category,external_games.url,follows,game_modes.name,genres.name,hypes,involved_companies,keywords.name,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,player_perspectives.name,total_rating,total_rating_count,screenshots.url,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,slug,storyline,summary,tags,themes.name,url,videos.name,videos.video_id,websites.game,websites.category,websites.url,language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,game_localizations.name,game_localizations.region.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', '', 'category=(0,1,2,4,5,8,9)', true, searchterm, 1, '')

	console.log(searchConfig)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			// console.log(searchResults)
			responseObj = {
				id: searchResults.id,
				age_ratings: searchResults.age_ratings !== undefined ? searchResults.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
				artworks: searchResults.artworks ? searchResults.artworks?.map((indImage: any) => (
					`https:${indImage.url.replace('thumb', '1080p')}`
				)) : [placeholderImages.NoArtworkScreenshotImage],
				category: searchResults.category ? categoryMap.get(searchResults?.category) : 'Unknown Category',
				cover: searchResults.cover ? `https:${searchResults.cover.url.replace('thumb', '1080p')}` : placeholderImages.NoArtworkScreenshotImage,
				external_games: searchResults.external_games ? searchResults.external_games.filter((indExternal: any) => indExternal.url && indExternal.url !== '').filter((indCategory: any) => ExternalCategories.map((indExternal) => indExternal.source).includes(indCategory.category)).map((indCategory: any) => ({
					category: indCategory.category,
					url: indCategory.url,
				})) : ([{ category: 0, url: '' }]),
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A',
				likes: searchResults.follows ? searchResults.follows : 0,
				game_modes: searchResults.game_modes ? searchResults.game_modes.map((indMode: any) => indMode.name) : ['Not provided'],
				genres: searchResults.genres ? searchResults.genres : [{ id: 0, name: 'Not provided' }],
				hypes: searchResults.hypes ? searchResults.hypes : 0,
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				keywords: searchResults.keywords ? searchResults.keywords.map((indKeyword: any) => indKeyword.name) : ['Not provided'],
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				platforms: searchResults.platforms ? searchResults.platforms.map((indPlatform: any) => ({
					name: indPlatform.name,
					category: indPlatform.category,
					url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
					id: indPlatform.id,
					platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
				})) : [{ name: 'None', category: 0, url: '', id: 0, platform_family: 0 }],
				player_perspectives: searchResults.player_perspectives ? searchResults.player_perspectives.map((indPersp: any) => indPersp.name) : ['Not provided'],
				screenshots: searchResults.screenshots ? searchResults.screenshots.map((indImage: any) => (
					`https:${indImage.url.replace('thumb', '1080p')}`
				)) : [placeholderImages.NoArtworkScreenshotImage],
				similar_games: populateSimilarGames(searchResults.similar_games),
				slug: searchResults.slug ? searchResults.slug : 'none',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				tags: searchResults.tags ? searchResults.tags : 'None',
				themes: searchResults.themes ? searchResults.themes : [{ id: 0, name: 'None' }],
				rating: searchResults.total_rating ? searchResults.total_rating : 0,
				ratingCount: searchResults.total_rating_count ? searchResults.total_rating_count : 0,
				url: searchResults.url ? searchResults.url : 'https://igdb.com',
				videos: searchResults.videos ? searchResults.videos.map((indVideo: any) => ({
					name: indVideo.name,
					ytlink: indVideo.video_id
				})) : [{ name: 'Generic Youtube Video', ytlink: 'ByGJQzlzxQg' }],
				websites: searchResults.websites ? searchResults.websites.filter((indWeb: any) => indWeb.url && indWeb.url !== '').filter((indCategory: any) => WebsiteCategories.map((indExternal) => indExternal.source).includes(indCategory.category)).map((indCategory: any) => ({
					category: indCategory.category,
					url: indCategory.url,
				})) : [{ category: 0, url: '' }],
				languages: searchResults.language_supports ? searchResults.language_supports.map((indLanguage: any) => ({
					language: indLanguage.language.name,
					language_support_type: indLanguage.language_support_type.name,
					locale: indLanguage.language.locale,
					native: indLanguage.language.native_name,
					marked: false
				})) : [{ language: 'None', language_support_type: 'Not specified', locale: 'N', native: 'None', marked: false }],
				game_localizations: searchResults.game_localizations ? searchResults.game_localizations.map((indLocalization: any) => ({
					name: indLocalization.name,
					region: indLocalization.region.name
				})) : [{ name: '', region: '' }],
			}
			const ageRatingsobj: AgeRatings = {
				'ESRB': responseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1).length !== 0 ? responseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1)[0].rating : 0,
				'PEGI': responseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2).length !== 0 ? responseObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2)[0].rating : 0
			}
			responseObj.age_ratings = ageRatingsobj
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}
	return response.status(200).json(responseObj!)

})

app.post('/api/artwork', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: ArtworkObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid: number = body.gameid

	if (gameid === null || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,artworks.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				artworks: searchResults.artworks ? searchResults.artworks.map((indImage: any) => (`https:${indImage.url.replace('thumb', '1080p')}`)) : [placeholderImages.NoArtworkScreenshotImage] ,
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve artworks for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/screenshots', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: ScreenshotsObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid: number = body.gameid

	if (gameid === null || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,screenshots.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				screenshots: searchResults.screenshots ? searchResults.screenshots.map((indImage: any) => (`https:${indImage.url.replace('thumb', '1080p')}`)) : [placeholderImages.NoArtworkScreenshotImage] ,
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve in-game screenshots for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/language', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: LanguageObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid

	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				language_supports: searchResults.language_supports ? searchResults.language_supports.map((indLanguage: any) => ({
					language: indLanguage.language.name,
					language_support_type: indLanguage.language_support_type.name,
					locale: indLanguage.language.locale,
					native: indLanguage.language.native_name,
					marked: false
				})) : [{ language: 'None', language_support_type: 'Not specified', locale: 'N', native: 'None', marked: false }],
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve language supports for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/similargames', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: SimilarGamesObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid

	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				similar_games: populateSimilarGames(searchResults.similar_games),
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve similar games for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/videos', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: VideoObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid

	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig = updateIGDBSearchConfig('games', 'id,videos.name,videos.video_id,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				videos: searchResults.videos ? searchResults.videos.map((indVideo: any) => ({
					name: indVideo.name,
					ytlink: indVideo.video_id
				})) : [{ name: 'Generic Youtube Video', ytlink: 'ByGJQzlzxQg' }],
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve videos for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/websites', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: WebsiteObj & GlobalAuxiliaryObj
	let errSearch = false
	let searchConfig: SearchConfig
	const gameid = body.gameid

	if (gameid === null || gameid === '' || !gameid) {
		return response.status(400).json({
			error: `No game id specified: ${gameid}`
		})
	}
	searchConfig= updateIGDBSearchConfig('games', 'id,websites.game,websites.category,websites.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,storyline,first_release_date', gameid, '', false, '', 0, '')
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data[0]
			responseObj = {
				websites: searchResults.websites ? searchResults.websites.filter((indWeb: any) => indWeb.url && indWeb.url !== '').filter((indCategory: any) => WebsiteCategories.map((indExternal) => indExternal.source).includes(indCategory.category)).map((indCategory: any) => ({
					category: indCategory.category,
					url: indCategory.url,
				})) : [{ category: 0, url: '' }],
				title: searchResults.name ? searchResults.name : 'Unknown Title',
				involved_companies: searchResults.involved_companies ? searchResults.involved_companies.map((indCompany: any) => ({
					name: indCompany.company.name,
					url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
					officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
				})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
				summary: searchResults.summary ? searchResults.summary : 'there is no official summary published for this game.',
				story: searchResults.storyline ? searchResults.storyline : 'there is no official storyline published for this game.',
				releaseDate: searchResults.first_release_date ? new Date(searchResults.first_release_date*1000) : 'N/A'
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: `Unable to retrieve websites for game id: ${gameid}`
		})
	}
	return response.status(200).json(responseObj!)
})

app.post('/api/search', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: any[] = [] //change to real type
	let errSearch = false
	let searchConfig: SearchConfig
	let searchterm = body.searchterm.replace('+', ' ')

	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}
	//Original without category filter
	// searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,artworks.url,category,cover.url,first_release_date,external_games.category,external_games.url,follows,game_modes.name,genres.name,hypes,involved_companies,keywords.name,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,player_perspectives.name,total_rating,total_rating_count,screenshots.url,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,slug,storyline,summary,tags,themes.name,url,videos.name,videos.video_id,websites.game,websites.category,websites.url,language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,game_localizations.name,game_localizations.region.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', '', '', true, searchterm, 1, '')
	//check that category = 0: Main Game not a DLC
	searchConfig = updateIGDBSearchConfig('games', 'id,category,cover.url,first_release_date,follows,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,total_rating,total_rating_count,involved_companies.company.name, involved_companies.company.websites.url,involved_companies.company.logo.url,involved_companies.developer', '', 'category=(0,1,2,4,5,8,9) & involved_companies!=n', true, searchterm, 10, '')

	console.log(searchConfig)
	await axios(searchConfig)
		.then((response) => {
			searchResults = response.data
			console.log(searchResults)
			for (let i = 0; i < searchResults.length; i++) {
				const indResponseObj = {
					id: searchResults[i].id,
					category: searchResults[i].category ? categoryMap.get(searchResults[i]?.category) : 'Unknown Category',
					cover: searchResults[i].cover ? `https:${searchResults[i].cover.url.replace('thumb', '1080p')}` : placeholderImages.NoArtworkScreenshotImage,
					releaseDate: searchResults[i].first_release_date ? new Date(searchResults[i].first_release_date*1000) : 'N/A',
					likes: searchResults[i].follows ? searchResults[i].follows : 0,
					involved_companies: searchResults[i].involved_companies ? searchResults[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
						name: indCompany.company.name,
						url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
						officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
					})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
					title: searchResults[i].name ? searchResults[i].name : 'Unknown Title',
					platforms: searchResults[i].platforms ? searchResults[i].platforms.map((indPlatform: any) => ({
						name: indPlatform.name,
						category: indPlatform.category,
						url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
						id: indPlatform.id,
						platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
					})): [{ name: 'None', category: 0, url: '', id: 0, platform_family: 0 }],
					rating: searchResults[i].total_rating
				}
				responseObj.push(indResponseObj)
			}
		})
		.catch((err) => {
			errSearch = true
			console.log(err)
		})
	if (errSearch) {
		return response.status(404).json({
			Message: 'Search yielded no results'
		})
	}
	return response.status(200).json(responseObj)
})


const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})

function err(reason: any): PromiseLike<never> {
	throw new Error('Function not implemented.')
}
