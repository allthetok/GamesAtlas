/* eslint-disable no-case-declarations */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { requestLogger, corsOptions, updateIGDBSearchConfig, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, updateIGDBSearchConfigMulti, getPlatformLogosIter, platformFamilyQuerified, parseBody, populateSimilarGames, categoriesCheck, errorHandleMiddleware, populateSearchItems, updateIGDBSearchConfigSpec, populateCompanySearch, retrieveFormattedMapID, parseNullable, retrieveRatingDateFormatted, parseLargeBody, arrayToPostgresArray, parseProfileBody, updateIGDBSearchConfigMultiProfile } from '../helpers/requests'
import { hashPassword, authPassword } from '../helpers/auth'
import { AgeRatings, ArtworkObj, Categories, Companies, Covers, Explore, GameDetailObj, GameObj, GlobalAuxiliaryObj, LanguageObj, Languages, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SearchObj, SimilarGamesObj, SimilarObj, VideoObj, Videos, WebsiteObj } from '../helpers/betypes'
import { ExternalCategories, WebsiteCategories, placeholderImages } from '../helpers/ratingsvglinks'
require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import { pool } from './db'
import axios, { AxiosResponse } from 'axios'
import cors from 'cors'
import SQL, { SQLStatement } from 'sql-template-strings'
import pg, { Client, QueryResult } from 'pg'
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
		.then(async (response: any) => {
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
		.catch((err: any) => {
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
	// 	.then(async (response: any) => {
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
	// 	.catch((err: any) => {
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
		.then((response: any) => {
			searchResults = response.data[0]
			// console.log(searchResults)
			responseObj = {
				id: searchResults.id,
				age_ratings: searchResults.age_ratings !== undefined ? searchResults.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
				artworks: searchResults.artworks ? searchResults.artworks?.map((indImage: any) => (
					`https:${indImage.url.replace('thumb', '1080p')}`
				)) : [placeholderImages.NoArtworkScreenshotImage],
				category: categoryMap.get(searchResults.category),
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
		.then((response: any) => {
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
		.catch((err: any) => {
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
	let responseObj: SearchObj[]
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
		.then((response: any) => {
			searchResults = response.data
			responseObj = populateSearchItems(searchResults)
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
	return response.status(200).json(responseObj!)
})

app.post('/api/companysearch', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: Companies[]
	let errSearch = false
	let searchConfig: SearchConfig
	const searchterm = body.searchterm
	const nullable = body.nullable

	if (searchterm === '' || !searchterm) {
		return response.status(400).json({
			error: 'No search term specified'
		})
	}

	searchConfig = updateIGDBSearchConfigSpec('companies', 'name,logo.url,websites.url,websites.category', nullable, 'name', searchterm, 'start_date asc')
	console.log(searchConfig)
	await axios(searchConfig)
		.then((response: any) => {
			searchResults = response.data
			responseObj = populateCompanySearch(searchResults)
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
	return response.status(200).json(responseObj!)

})

app.post('/api/advsearchdeprecated', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []
	let indResponseObj: Explore

	const sortBy = body.sortBy
	const sortDirection = body.sortDirection
	// const externalFilter = body.externalFilter
	const nullable = body.nullable
	const platforms = body.platforms
	const limit = body.limit
	const releaseDate = body.releaseDate
	const rating = body.rating
	const genres = body.genres
	const themes = body.themes
	const gameModes = body.gameModes
	const category = body.category
	const companies = body.companies


	// const { externalFilter, platformFamily, limit, sortBy } = parseBody(body)

	if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
		response.status(400).json({
			error: `No direction and sort specified: ${body.sortBy}`
		})
	}
	// else if (body.externalFilter === null || body.externalFilter === '' || !body.externalFilter) {
	// 	response.status(400).json({
	// 		error: `No filter specified: ${body.sortBy}`
	// 	})
	// }
	else if (body.limit === null || body.limit === 0 || !body.limit) {
		response.status(400).json({
			error: `No limit specified or limit equal to: ${body.limit}`
		})
	}
	else if (body.sortDirection === null || body.sortDirection === '' || !body.sortDirection) {
		response.status(400).json({
			error: `No limit specified or limit equal to: ${body.limit}`
		})
	}

	searchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}games`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}

	searchConfig.data = 'fields id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count,genres.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer,involved_companies.company.websites.url,involved_companies.company.websites.category,game_modes,category; where '
	// where age_ratings != n & follows!= n & involved_companies != n & game_modes != n & category != n`
	// const resultArray: string[] = [retrieveFormattedMapID('Platforms', platforms), retrieveFormattedMapID('Genres', genres), retrieveFormattedMapID('Themes', themes), retrieveFormattedMapID('Game Modes', gameModes), retrieveFormattedMapID('Category', category)].filter((res: string) => res.length !== 0)
	// searchConfig.data = resultArray.length !== 0 ? searchConfig.data.concat(' & ', resultArray.join(' & ')) : searchConfig.data.concat(';')
	// searchConfig.data = searchConfig.data.concat(`limit ${limit}; sort ${sortMap.get(sortBy)} ${sortDirection}`)

	let resultArray: string[] = [retrieveFormattedMapID('platforms', platforms), retrieveFormattedMapID('genres', genres), retrieveFormattedMapID('themes', themes), retrieveFormattedMapID('game_modes', gameModes), retrieveFormattedMapID('category', category), retrieveRatingDateFormatted('total_rating', rating), retrieveRatingDateFormatted('first_release_date', releaseDate)].filter((res: string) => res.length > 0)
	searchConfig.data = resultArray.length !== 0 ? searchConfig.data.concat(resultArray.join(' & '), parseNullable(nullable), ';') : searchConfig.data.concat(parseNullable(nullable).slice(2), ';')
	searchConfig.data = searchConfig.data.concat(`limit ${limit}; sort ${sortMap.get(sortBy)} ${sortDirection};`)
	// searchConfig.data = searchConfig.data.concat(parseNullable(nullable))

	console.log(searchConfig.data)

	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data
			responseObj = populateSimilarGames(searchResults)
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
	return response.status(200).json(responseObj!)
})

app.use('/api/advsearch', (request: Request, response: Response, next: NextFunction) => {
	const body = request.body
	errorHandleMiddleware(request.baseUrl, body, response)
	next()
})

app.use('/api/advsearch', async (request: Request, response: Response, next: NextFunction) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []
	const { externalFilter, platformFamily, limit, sortBy } = parseLargeBody(body)

	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count,genres.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer,involved_companies.company.websites.url,involved_companies.company.websites.category,game_modes,category', '', externalFilter, false, '', limit, sortBy)
	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data
			responseObj = populateSimilarGames(searchResults)
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
	else {
		response.json(responseObj)
		next()
	}
})

app.post('/api/advsearch', async (request: Request, response: Response, next: NextFunction) => {
	return response.status(200)
})

app.post('/api/advsearchalt', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []
	const { externalFilter, platformFamily, limit, sortBy } = parseLargeBody(body)

	if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
		return response.status(400).json({
			error: `No direction and sort specified: ${body.sortBy}`
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

	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count,genres.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer,involved_companies.company.websites.url,involved_companies.company.websites.category,game_modes,category', '', externalFilter, false, '', limit, sortBy)
	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data
			responseObj = populateSimilarGames(searchResults)
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
	return response.status(200).json(responseObj!)
})

app.get('/api/createUser', async (request: Request, response: Response) => {
	await pool.query(SQL`
		CREATE TABLE users
			( id SERIAL PRIMARY KEY, 
			username VARCHAR(100) DEFAULT '', 
			email VARCHAR(100) NOT NULL, 
			password VARCHAR(100) DEFAULT '', 
			emailVerified BOOLEAN DEFAULT FALSE, 
			prevlogin TIMESTAMP, 
			image VARCHAR(500) DEFAULT '',
			externalid VARCHAR(200) DEFAULT '', 
			provider VARCHAR(100) NOT NULL )`)
		.then(() => {
			console.log(pool.query)
			return response.status(200).json({
				Message: 'Successfully created table: users'
			})
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(500).json({
				error: 'Unable to create table: users'
			})
		})
})

app.get('/api/createProfile', async (request: Request, response: Response) => {
	await pool.query(SQL`
		CREATE TABLE userprofiles 
			( profileid SERIAL PRIMARY KEY, 
			userid INT UNIQUE NOT NULL, 
			platform VARCHAR(200)[] DEFAULT '{}', 
			genres VARCHAR(200)[] DEFAULT '{}', 
			themes VARCHAR(200)[] DEFAULT '{}', 
			gameModes VARCHAR(200)[] DEFAULT '{}', 
			CONSTRAINT FOREIGN_USER FOREIGN KEY(userid) REFERENCES users(id) )`)
		.then(() => {
			console.log(pool.query)
			return response.status(200).json({
				Message: 'Successfully created table: userprofiles'
			})
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(500).json({
				error: 'Unable to create table: userprofiles'
			})
		})
})

app.get('/api/createLikes', async (request: Request, response: Response) => {
	await pool.query(SQL`
		CREATE TABLE userlikes
			( likeid SERIAL PRIMARY KEY,
			userid INT NOT NULL,
			gameid INT NOT NULL,
			gameobj JSON,
			CONSTRAINT FOREIGN_USER FOREIGN KEY(userid) REFERENCES users(id) )`)
		.then(() => {
			console.log(pool.query)
			return response.status(200).json({
				Message: 'Successfully created table: userlikes'
			})
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(500).json({
				error: 'Unable to create table: userlikes'
			})
		})
})

app.get('/api/createRecommend', async (request: Request, response: Response) => {
	await pool.query(SQL`
		CREATE TABLE likesrecommend
			( igdbid INT UNIQUE NOT NULL PRIMARY KEY,
			recommendobjarr JSON[] DEFAULT '{}' )`)
		.then(() => {
			console.log(pool.query)
			return response.status(200).json({
				Message: 'Successfully created table: likesrecommend'
			})
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(500).json({
				error: 'Unable to create table: likesrecommend'
			})
		})
})

app.post('/api/createUser', async (request: Request, response: Response) => {
	const body = request.body
	const username: string = body.username
	const email: string = body.email
	const password: string =  body.password
	const provider: string = body.provider
	let queryResult: any
	let userExists: boolean = false
	let hashPass: string = ''

	if (!email || email === '' || email === null) {
		return response.status(400).json({
			error: 'No email provided'
		})
	}
	else if (!username || username === '' || username === null) {
		return response.status(400).json({
			error: 'No username provided'
		})
	}
	else if (!password || password === '' || password === null) {
		return response.status(400).json({
			error: 'No password provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE (u.email=${email} OR u.username=${username})
				AND u.provider=${provider})`)
		.then((response: any) => {
			if (response.rows.length !== 0) {
				userExists = !userExists
			}
		})
	if (userExists) {
		return response.status(400).json({
			error: `There already exists a user with username: ${username} or email:${email}`
		})
	}
	hashPass = await hashPassword(10, password)
	await pool.query(SQL`
		WITH new_user AS (
			INSERT INTO users (username, email, password, emailVerified, prevlogin, provider)
			VALUES (${username}, ${email}, ${hashPass}, FALSE, to_timestamp(${Date.now()} / 1000.0), ${provider})
			RETURNING id, username, email, emailVerified, provider
		),
		new_profile AS (   
			INSERT INTO userprofiles (userid) SELECT id FROM new_user RETURNING profileid
		)
		SELECT u.id, u.username, u.email, u.emailVerified, u.provider, up.profileid 
		FROM new_user u, new_profile up;`)
		.then(async (response: any) => {
			console.log(response)
			console.log(response.rows[0])
			queryResult = response.rows[0]
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to insert record for ${username}, ${email}`
			})
		})
	return queryResult === null ? response.status(404).json({ error: `Failed to insert record for ${username}, ${email}` }) : response.status(200).json(queryResult)
})

app.post('/api/loginOAuthUser', async (request: Request, response: Response) => {
	const body = request.body
	const username: string = body.username
	const email: string = body.email
	const emailVerified = body.emailVerified
	const externalId: string = body.externalId
	const image = body.image
	const provider: string = body.provider
	let queryResult: any
	let userExists: boolean = false
	let userId: number

	if (!email || email === '' || email === null) {
		return response.status(400).json({
			error: 'No email provided'
		})
	}
	else if (!username || username === '' || username === null) {
		return response.status(400).json({
			error: 'No username provided'
		})
	}
	else if (!provider || provider === '' || provider === null) {
		return response.status(400).json({
			error: 'No username provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.email=${email} 
				AND u.provider=${provider})`)
		.then((response: any) => {
			if (response.rows.length !== 0) {
				userExists = !userExists
			}
		})
	if (userExists) {
		console.log(userExists)
		await pool.query(SQL`
			UPDATE users SET
				prevlogin=to_timestamp(${Date.now()} / 1000.0)
				WHERE email=${email}
				AND externalId=${externalId}
				AND provider=${provider}
				RETURNING id, username, email, provider, 0 AS profileid`)
			.then((response: any) => {
				console.log(response)
				queryResult = response !== null ? response.rows[0] : null
				console.log(queryResult)
				userId = queryResult.id
			})
			.catch((err: any) => {
				return response.status(404).json({
					error: `Failed to update record for ${username}, ${email}`
				})
			})
		if (queryResult === null) {
			return response.status(400).json({
				error: `Failed to update record for ${username}, ${email}`
			})
		}
		await pool.query(SQL`
			SELECT profileid
			FROM userprofiles
			WHERE userid = ${userId}`)
			.then((response: any) => {
				console.log(response)
				queryResult.profileid = response.rows.length !== 0 ? response.rows[0].profileid : 0
			})
			.catch((err: any) => {
				console.log(err)
				queryResult.profileid = 0
			})
		return queryResult === null ? response.status(400).json({ error: `Failed to update record for ${username}, ${email}` }) : response.status(200).json(queryResult)
	}
	else {
		await pool.query(SQL`
		WITH new_user AS (
			INSERT INTO users (username, email, emailVerified, externalId, prevlogin, provider)
			VALUES (${username}, ${email}, ${emailVerified}, ${externalId}, to_timestamp(${Date.now()} / 1000.0), ${provider})
			RETURNING id, username, email, emailVerified, provider
		),
		new_profile AS (   
			INSERT INTO userprofiles (userid) SELECT id FROM new_user RETURNING profileid
		)
		SELECT u.id, u.username, u.email, u.emailVerified, u.provider, up.profileid 
		FROM new_user u, new_profile up;`)
			.then((response: any) => {
				queryResult = response !== null ? response.rows[0] : null
			})
			.catch((err: any) => {
				return response.status(404).json({
					error: `Failed to insert record for ${username}, ${email} with externalid: ${externalId}`
				})
			})
		return queryResult === null ? response.status(404).json({ error: `Failed to insert record for ${username}, ${email} with externalid: ${externalId}` }): response.status(200).json(queryResult)
	}

})

app.post('/api/check', async (request: Request, response: Response) => {
	const body = request.body
	let queryResult: any

	await pool.query(SQL`
		SELECT * FROM users u 
			WHERE u.email=${body.email} 
			AND u.provider=${body.provider}`)
		.then((response: any) => {
			queryResult = response.rows[0]
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to retrieve records within users and userprofiles tables`
			})
		})

	return response.status(200).json(queryResult)
})

app.post('/api/resolveUser', async (request: Request, response: Response) => {
	const body = request.body
	const email: string = body.email
	const username: string = body.username
	const provider: string = body.provider
	let userExists: boolean = false

	if (!email || email === '' || email === null) {
		return response.status(400).json({
			error: 'No email provided'
		})
	}
	else if (!provider || provider === '' || provider === null) {
		return response.status(400).json({
			error: 'No provider specified'
		})
	}
	if (username !== '') {
		await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE (u.email=${email} OR u.username=${username}) 
				AND u.provider=${provider})`)
			.then((response: any) => {
				if (response.rows.length !== 0) {
					userExists = !userExists
				}
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({
					error: `Failed to retrieve records within users and userprofiles tables`
				})
			})
	}
	else {
		await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.email=${email} 
				AND u.provider=${provider})`)
			.then((response: any) => {
				if (response.rows.length !== 0) {
					userExists = !userExists
				}
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({
					error: `Failed to retrieve records within users and userprofiles tables`
				})
			})
	}

	return response.status(200).json({
		userExists: userExists,
		message: userExists ? `User with this email: ${email} and provider: ${provider} does exist` : `User with this email: ${email} and provider: ${provider} doesn't exist`
	})
})

app.post('/api/login', async (request: Request, response: Response) => {
	const body = request.body
	const email: string = body.email
	const password: string = body.password
	const provider: string = body.provider
	let invalidUser: boolean = false
	let matchPass: boolean = false
	let queryResult: any

	if (!email || email === '' || email === null) {
		return response.status(400).json({
			error: 'No email provided'
		})
	}
	else if (!password || password === '' || password === null) {
		return response.status(400).json({
			error: 'No password provided'
		})
	}
	else if (!provider || provider === '' || provider === null) {
		return response.status(400).json({
			error: 'No provider specified'
		})
	}

	await pool.query(SQL`
		SELECT u.id, u.email, u.username, u.password, u.provider, up.profileid
		FROM users u 
		INNER JOIN userprofiles up 
		ON u.id = up.userid
		WHERE u.email=${email} 
		AND u.provider=${provider}`)
		.then(async (response: any) => {
			queryResult = response
			if (queryResult.rows.length === 0) {
				invalidUser = !invalidUser
			}
			else {
				queryResult = queryResult.rows[0]
				matchPass = await authPassword(password, queryResult.password)
			}
		})
	if (invalidUser) {
		return response.status(400).json({
			error: 'User with this email was not found'
		})
	}
	if (!matchPass) {
		return response.status(400).json({
			error: 'Incorrect password'
		})
	}
	await pool.query(SQL`
		UPDATE users SET 
			prevlogin=to_timestamp(${Date.now()} / 1000.0) 
			WHERE id=${queryResult.id} 
			AND email=${queryResult.email}
			RETURNING id, username, email, emailVerified, provider, ${queryResult.profileid} AS profileid`)
		.then((response: any) => {
			queryResult = response !== null ? response.rows[0] : null
		})
		.catch((err: any) => {
			return response.status(404).json({
				error: `Failed to login user with email:${email}`
			})
		})
	return queryResult === null ? response.status(404).json({ error: `Failed to login user with email:${email}` }) : response.status(200).json(queryResult)
})

app.post('/api/profileDetails', async (request: Request, response: Response) => {
	const body = request.body
	const userid = body.userid
	const profileid = body.profileid
	let queryResult: any
	let userExists: boolean = true

	if (userid === null || !userid || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (profileid === null || !profileid || profileid === undefined) {
		return response.status(400).json({
			error: 'No profileid provided'
		})
	}
	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.id = ${userid} 
				AND up.profileid = ${profileid})`)
		.then((response: any) => {
			if (response.rows.length !== 1) {
				userExists = !userExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(400).json({
				error: 'Unable to retrieve data from user and profile tables'
			})
		})
	if (!userExists) {
		return response.status(400).json({
			error: `User with this userid: ${userid} and profileid: ${profileid} does not exist`
		})
	}
	await pool.query(SQL`
		SELECT up.platform,
			   up.genres,
			   up.themes,
			   up.gameModes
		FROM userprofiles up 
		INNER JOIN users u 
		ON up.userid = u.id
		WHERE up.profileid = ${profileid}
		AND u.id = ${userid}`)
		.then((response: any) => {
			queryResult = response !== null ? response.rows[0] : null
		})
		.catch((err: any) => {
			return response.status(404).json({
				error: `Failed to retrieve game preferences for userid: ${userid}, profileid: ${profileid}`
			})
		})
	return queryResult === null ? response.status(404).json({ error: `Failed to retrieve game preferences for userid: ${userid}, profileid: ${profileid}` }) : response.status(200).json(queryResult)
})

app.post('/api/userDetails', async (request: Request, response: Response) => {
	const body = request.body
	const userid = body.userid
	const profileid = body.profileid
	const provider = body.provider
	let queryResult: any
	let userExists: boolean = true

	if (userid === null || !userid || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (profileid === null || !profileid || profileid === undefined) {
		return response.status(400).json({
			error: 'No profileid provided'
		})
	}
	else if (provider === null || !provider || provider === undefined || provider === '') {
		return response.status(400).json({
			error: 'No provider provided'
		})
	}
	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.id = ${userid} 
				AND up.profileid = ${profileid}
				AND u.provider = ${provider})`)
		.then((response: any) => {
			if (response.rows.length !== 1) {
				userExists = !userExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(400).json({
				error: 'Unable to retrieve data from user and profile tables'
			})
		})
	if (!userExists) {
		return response.status(400).json({
			error: `User with this userid: ${userid} and profileid: ${profileid} does not exist`
		})
	}
	await pool.query(SQL`
		SELECT u.username, u.email, u.provider FROM users u 
			INNER JOIN userprofiles up 
			ON u.id = up.userid 
			WHERE u.id = ${userid} 
			AND up.profileid = ${profileid}
			AND u.provider = ${provider}`)
		.then((response: any) => {
			queryResult = response.rows.length !== 0 ? response.rows[0] : null
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: 'Unable to query users and userprofiles tables'
			})
		})
	return queryResult !== null ? response.status(200).json(queryResult) : response.status(400).json({ error: `Unable to retrieve username, email and provider with specified userid: ${userid} and profileid: ${profileid}` })
})

app.patch('/api/profileDetails', async (request: Request, response: Response) => {
	const body = request.body
	const userid = body.userid
	const profileid = body.profileid
	const platforms = body.platforms
	const genres = body.genres
	const themes = body.themes
	const gameModes = body.gameModes
	let queryResult: any
	let userExists: boolean = true

	if (userid === null || !userid || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (profileid === null || !profileid || profileid === undefined) {
		return response.status(400).json({
			error: 'No profileid provided'
		})
	}
	else if (platforms === null || !platforms || platforms === undefined) {
		return response.status(400).json({
			error: 'No platforms provided'
		})
	}
	else if (genres === null || !genres || genres === undefined) {
		return response.status(400).json({
			error: 'No genres provided'
		})
	}
	else if (themes === null || !themes || themes === undefined) {
		return response.status(400).json({
			error: 'No themes provided'
		})
	}
	else if (gameModes === null || !gameModes || gameModes === undefined) {
		return response.status(400).json({
			error: 'No game modes provided'
		})
	}
	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.id = ${userid} 
				AND up.profileid = ${profileid})`)
		.then((response: any) => {
			if (response.rows.length !== 1) {
				userExists = !userExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(400).json({
				error: 'Unable to retrieve data from user and profile tables'
			})
		})
	if (!userExists) {
		return response.status(400).json({
			error: `User with this userid: ${userid} and profileid: ${profileid} does not exist`
		})
	}

	const formattedArrays = {
		platforms: arrayToPostgresArray(platforms),
		genres: arrayToPostgresArray(genres),
		themes: arrayToPostgresArray(themes),
		gameModes: arrayToPostgresArray(gameModes)
	}

	await pool.query(SQL`
	UPDATE userprofiles SET 
	 		platform = ${formattedArrays.platforms},
			 genres = ${formattedArrays.genres},
			 themes = ${formattedArrays.themes},
			 gameModes = ${formattedArrays.gameModes}
	 	WHERE userid = ${userid} 
	 	AND profileid = ${profileid}
	 	RETURNING platform, genres, themes, gameModes`)
		.then((response: any) => {
			queryResult = response !== null ? response.rows[0] : null
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(400).json({
				error: 'Unable to edit userprofiles arrays: platforms, genres, themes, gameModes'
			})
		})
	return queryResult === null ? response.status(404).json({ error: `Failed to retrieve game preferences for userid: ${userid}, profileid: ${profileid}` }) : response.status(200).json(queryResult)
})

app.patch('/api/userDetails', async (request: Request, response: Response) => {
	const body = request.body
	const userid = body.userid
	const profileid = body.profileid
	const provider = body.provider
	const username = body.username
	const email = body.email
	const password = body.password
	const specField = body.specField
	let queryResult: any
	let userExists: boolean = true
	let fieldTaken: boolean = false
	let queryString: SQLStatement

	if (specField === null || !specField || specField === undefined || specField === '') {
		return response.status(400).json({
			error: `Did not specify which user attribute to update: ${specField}`
		})
	}
	else if (userid === null || !userid || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (profileid === null || !profileid || profileid === undefined) {
		return response.status(400).json({
			error: 'No profileid provided'
		})
	}
	else if (provider === null || !provider || provider === undefined) {
		return response.status(400).json({
			error: 'No provider provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS 
			(SELECT * FROM users u 
				INNER JOIN userprofiles up 
				ON u.id = up.userid 
				WHERE u.id = ${userid} 
				AND up.profileid = ${profileid}
				AND u.provider = ${provider})`)
		.then((response: any) => {
			if (response.rows.length !== 1) {
				userExists = !userExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(400).json({
				error: 'Unable to retrieve data from user and profile tables'
			})
		})
	if (!userExists) {
		return response.status(400).json({
			error: `User with this userid: ${userid} and profileid: ${profileid} does not exist`
		})
	}

	switch (specField) {
	case 'username':
		if (username === null || !username || username === undefined || username === '') {
			return response.status(400).json({
				error: 'No username provided'
			})
		}
		await pool.query(SQL`
			SELECT 1 WHERE EXISTS 
				(SELECT * FROM users u 
					INNER JOIN userprofiles up
					ON u.id = up.userid
					WHERE u.id <> ${userid}
					AND up.profileid <> ${profileid}
					AND u.provider = ${provider}
					AND u.username = ${username})`)
			.then((response: any) => {
				fieldTaken = response.rows.length !== 0
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({ error: 'Unable to check if username exists' })
			})
		queryString = SQL`
			UPDATE users SET username=${username},
			prevlogin = to_timestamp(${Date.now()} / 1000.0)
			WHERE id = ${userid}
			RETURNING id, email, emailVerified, username, prevlogin, externalId, provider, ${profileid} AS profileid`
		break
	case 'email':
		if (email === null || !email || email === undefined || email === '') {
			return response.status(400).json({
				error: 'No email provided'
			})
		}
		await pool.query(SQL`
			SELECT 1 WHERE EXISTS 
				(SELECT * FROM users u 
					INNER JOIN userprofiles up
					ON u.id = up.userid
					WHERE u.id <> ${userid}
					AND up.profileid <> ${profileid}
					AND u.provider = ${provider}
					AND u.email = ${email})`)
			.then((response: any) => {
				fieldTaken = response.rows.length !== 0
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({ error: 'Unable to check if email exists' })
			})
		queryString = SQL`
			UPDATE users SET email=${email},
			prevlogin = to_timestamp(${Date.now()} / 1000.0)
			WHERE id = ${userid}
			RETURNING id, email, emailVerified, username, prevlogin, externalId, provider, ${profileid} AS profileid`
		break
	case 'both':
		if (email === null || !email || email === undefined || username === null || !username || username === undefined || username === '' || email === '') {
			return response.status(400).json({
				error: 'No username/email provided when updating both'
			})
		}
		await pool.query(SQL`
			SELECT 1 WHERE EXISTS 
				(SELECT * FROM users u 
					INNER JOIN userprofiles up
					ON u.id = up.userid
					WHERE u.id <> ${userid}
					AND up.profileid <> ${profileid}
					AND u.provider = ${provider}
					AND (u.email = ${email} OR u.username = ${username}) )`)
			.then((response: any) => {
				console.log(response)
				fieldTaken = response.rows.length !== 0
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({ error: 'Unable to check if email exists' })
			})
		queryString = SQL`
			UPDATE users SET username=${username},
			email=${email},
			prevlogin = to_timestamp(${Date.now()} / 1000.0)
			WHERE id = ${userid}
			RETURNING id, email, emailVerified, username, prevlogin, externalId, provider, ${profileid} AS profileid`
		break
	case 'password':
		if (password === null || !password || password === undefined) {
			return response.status(400).json({
				error: 'No password provided'
			})
		}
		const hashPass = await hashPassword(10, password)
		queryString = SQL`
			UPDATE users SET password=${hashPass},
			prevlogin = to_timestamp(${Date.now()} / 1000.0)
			WHERE id = ${userid}
			RETURNING id, email, emailVerified, username, prevlogin, externalId, provider, ${profileid} AS profileid`
		break
	default:
		return response.status(400).json({
			error: `Specified case does not exist and is not within: username/email/password/both, it is currently: ${specField}`
		})
	}

	if (fieldTaken) {
		return response.status(400).json({ error: 'This username or email is already taken' })
	}

	else {
		await pool.query(queryString)
			.then((response: any) => {
				queryResult = response !== null ? response.rows[0] : null
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(400).json({
					error: `Unable to edit user details for userid: ${userid}, profileid: ${profileid}`
				})
			})
		return queryResult === null ? response.status(404).json({ error: `Failed to retrieve and update user details for userid: ${userid}, profileid: ${profileid}` }) : response.status(200).json(queryResult)
	}
})

app.post('/api/usernameEmail', async (request: Request, response: Response) => {
	const body = request.body
	const username: string = body.username
	const provider: string = body.provider
	let invalidUser: boolean = false
	let queryResult: any

	if (!username || username === '' || username === null) {
		return response.status(400).json({
			error: 'No username provided'
		})
	}
	else if (!provider || provider === '' || provider === null) {
		return response.status(400).json({
			error: 'No provider specified'
		})
	}

	await pool.query(SQL`
		SELECT u.id, u.email, u.username, u.password, u.provider, up.profileid
		FROM users u 
		INNER JOIN userprofiles up 
		ON u.id = up.userid
		WHERE u.username=${username} 
		AND u.provider=${provider}`)
		.then(async (response: any) => {
			queryResult = response
			if (queryResult.rows.length === 0 || queryResult.rows === null) {
				invalidUser = !invalidUser
			}
			else {
				queryResult = queryResult.rows[0]
			}
		})
	if (invalidUser) {
		return response.status(400).json({
			'email': null
		})
	}
	return invalidUser ? response.status(400).json({ 'email': null }) : response.status(200).json({ 'email': queryResult.email })
})

app.post('/api/recommendPrefs', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let filledResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let indPrefResponseObj: Explore[] = []
	let responseObj: any

	const profilePrefBody = parseProfileBody(body)

	if (profilePrefBody.userPref.platforms === '' && profilePrefBody.userPref.genres === '' && profilePrefBody.userPref.themes === '' && profilePrefBody.userPref.gameModes === '') {
		return response.status(400).json({
			message: 'Update atleast one of Your Platform, Favorite Genres, Favorite Themes, Favorite Game Types on Profile Page'
		})
	}

	searchConfig = updateIGDBSearchConfigMultiProfile('multiquery', 'id,age_ratings.category,age_ratings.rating,cover.url,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,first_release_date,follows,name,total_rating,total_rating_count,genres.name,involved_companies.company.name,involved_companies.company.logo.url,involved_companies.developer,involved_companies.company.websites.url,involved_companies.company.websites.category,game_modes,category', profilePrefBody.externalFilter, profilePrefBody.limit, profilePrefBody.sortBy, profilePrefBody.userPref.platforms, profilePrefBody.userPref.genres, profilePrefBody.userPref.themes, profilePrefBody.userPref.gameModes)

	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data
			if (searchResults.length === 0 || searchResults === null || searchResults === undefined) {
				errSearch = !errSearch
			}
			else {
				filledResults = searchResults.filter((indResult: any) => indResult.name && indResult.result.length !== 0)
				responseObj = filledResults.map((indResult: any) => ({ name: indResult.name, result: populateSimilarGames(indResult.result) }))
			}
		})
		.catch((err: any) => {
			errSearch = true
			console.log(err)
		})
	return errSearch ? response.status(404).json({ Message: 'With this set of preferences, search yielded no results' }) : response.status(200).json(responseObj)
})

app.post('/api/userlike', async (request: Request, response: Response) => {
	const body = request.body
	const userid: number = body.userid
	const gameid: number = body.gameid
	const gameExploreFormat: any = body.game
	const similarExploreFormat: any = body.similargames
	let queryLikeResult: any
	let likeExists: boolean = false

	if (!userid || userid === null || userid === undefined) {
		return response.status(400).json({
			error: 'No email provided'
		})
	}
	else if (!gameid || gameid === null || gameid === undefined) {
		return response.status(400).json({
			error: 'No gameid provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT * from userlikes ul
				WHERE ul.userid = ${userid} AND ul.gameid = ${gameid})`)
		.then((response: any) => {
			if (response.rows.length !== 0) {
				likeExists = !likeExists
			}
		})
	if (likeExists) {
		return response.status(400).json({
			error: `This game has already been liked by user: ${userid}`
		})
	}
	await pool.query(SQL`
		INSERT INTO userlikes (userid, gameid, gameobj)
		VALUES (${userid}, ${gameid}, ${gameExploreFormat})
		RETURNING likeid, userid, gameid, gameobj `)
		.then(async (response: any) => {
			console.log(response)
			console.log(response.rows[0])
			queryLikeResult = response.rows[0]
		})
		.catch()
})

const PORT = process.env.API_PORT || 3001

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`)
})

function err(reason: any): PromiseLike<never> {
	throw new Error('Function not implemented.')
}


