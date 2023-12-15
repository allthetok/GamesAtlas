/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { NextFunction, Request, Response } from 'express'
import axios from 'axios'
import { updateIGDBSearchConfig, updateIGDBSearchConfigMulti, parseBody, parseLargeBody, populateCompanySearch, populateSearchItems, populateSimilarGames, updateIGDBSearchConfigSpec } from '../helpers/requests'
import { AgeRatings, ArtworkObj, Companies, Explore, GameObj, GlobalAuxiliaryObj, LanguageObj, ScreenshotsObj, SearchConfig, SearchObj, SimilarGamesObj, VideoObj, WebsiteObj } from '../helpers/betypes'
import { categoryMap } from '../helpers/enums'
import { placeholderImages, ExternalCategories, WebsiteCategories } from '../helpers/ratingsvglinks'
require('dotenv').config()
const router = express.Router()

router.get('/', async (request: Request, response: Response) => {
	response.send('Welcome to GamesAtlas')
})

router.post('/overview', async (request: Request, response: Response) => {
	const body = request.body
	let searchResults: any
	let responseObj: GameObj
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
	searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,artworks.url,category,cover.url,first_release_date,external_games.category,external_games.url,follows,game_modes.name,genres.name,hypes,involved_companies,keywords.name,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,player_perspectives.name,total_rating,total_rating_count,screenshots.url,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,slug,storyline,summary,tags,themes.name,url,videos.name,videos.video_id,websites.game,websites.category,websites.url,language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,game_localizations.name,game_localizations.region.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', '', 'category=(0,1,2,3,4,5,8,9)', true, searchterm, 1, '')

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

router.post('/artwork', async (request: Request, response: Response) => {
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
	searchConfig = updateIGDBSearchConfig('games', 'id,artworks.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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
				summary: searchResults.summary ? searchResults.summary : 'There is no official summary published for this game.',
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

router.post('/screenshots', async (request: Request, response: Response) => {
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
	searchConfig = updateIGDBSearchConfig('games', 'id,screenshots.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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

router.post('/language', async (request: Request, response: Response) => {
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
	searchConfig = updateIGDBSearchConfig('games', 'language_supports.language.name,language_supports.language.locale,language_supports.language.native_name,language_supports.language_support_type.name,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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

router.post('/similargames', async (request: Request, response: Response) => {
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
	searchConfig = updateIGDBSearchConfig('games', 'id,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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

router.post('/videos', async (request: Request, response: Response) => {
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
	searchConfig = updateIGDBSearchConfig('games', 'id,videos.name,videos.video_id,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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

router.post('/websites', async (request: Request, response: Response) => {
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
	searchConfig= updateIGDBSearchConfig('games', 'id,websites.game,websites.category,websites.url,name,involved_companies,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category,summary,storyline,first_release_date', gameid, '', false, '', 0, '')
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

router.post('/search', async (request: Request, response: Response) => {
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

router.post('/companysearch', async (request: Request, response: Response) => {
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

router.post('/explore', async (request: Request, response: Response, next: NextFunction) => {
	const body = request.body
	let searchResults: any
	let errSearch = false
	let searchConfig: SearchConfig
	let responseObj: Explore[] = []

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
	await axios(searchConfig)
		.then(async (response: any) => {
			searchResults = response.data[0].result
			responseObj = populateSimilarGames(searchResults)
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
	return response.status(200).json(responseObj)
})

router.post('/advsearch', async (request: Request, response: Response) => {
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


export { router }