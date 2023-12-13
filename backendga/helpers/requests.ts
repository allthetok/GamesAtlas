/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios'
import { Request, Response, NextFunction } from 'express'
import { AgeRatings, MultiSearchObj, ArtworkObj, Categories, Companies, Covers, Explore, GameDetailObj, LanguageObj, Languages, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SimilarObj, VideoObj, Videos, WebsiteObj, SearchObj } from './betypes'
import { sortMap, platformMap, genreMap, categoryMap, platformSpecificMap, themeMap, gameModeMap, categorySpecificMap } from '../helpers/enums'
import { ExternalCategories, WebsiteCategories, placeholderImages } from './ratingsvglinks'
require('dotenv').config()

const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
	console.log('Method:', request.method)
	console.log('Path: ', request.url)
	console.log('Body: ', request.body)
	console.log('---')
	next()
}

const corsOptions = {
	// origin: 'http://localhost:3000',
	// origin: 'https://gamesatlasfe-3l6d-b9w82vw26-allthetok.vercel.app',
	origin: true,
	credentials: true,	//access-control-allow-credentials:true
	optionSuccessStatus: 200
}

const updateIGDBSearchConfig = (endpoint: string, datafields: string, stringofids: any, additionalfilter: string, search: boolean, searchterm: string, limit: number, sortby: string): SearchConfig => {
	const searchConfig: SearchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}
	if (search) {
		searchConfig.data = `search "${searchterm}"; fields ${datafields}; ${limit !== 0 ? ` limit ${limit};` : ''} ${additionalfilter !== '' ? `where ${additionalfilter};` : ''}`
	}
	else if (!search && sortby !== '') {
		searchConfig.data = `fields ${datafields}; sort ${sortby}; where ${additionalfilter}; limit ${limit};`
	}
	else {
		searchConfig.data = `fields ${datafields}; where id=(${stringofids})${additionalfilter !== '' ? ` & ${additionalfilter}` : ''};`
	}
	return searchConfig
}

const updateIGDBSearchConfigMulti = (endpoint: string, datafields: string, additionalfilter: string, platforms: string, limit: number, sortby: string): SearchConfig => {
	const searchConfig: SearchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}
	searchConfig.data = `query games "Filtered ${limit}" {fields ${datafields}; ${additionalfilter !== '' ? `where ${additionalfilter} ${platforms !== '' ? platforms : ''};` : ''} sort ${sortby}; limit ${limit};};`

	return searchConfig
}

const updateIGDBSearchConfigSpec = (endpoint: string, datafields: string, nullable: string, searchfield: string, searchterm: string, sortby: string): SearchConfig => {
	const searchConfig: SearchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}
	searchConfig.data = `fields ${datafields}; sort ${sortby}; where ${searchfield !== '' ? `${searchfield} ~ "${searchterm}"*` : ''} ${nullable !== '' ? `${parseNullable(nullable)}` : ''};`
	return searchConfig
}

const updateIGDBSearchConfigMultiProfile = (endpoint: string, datafields: string, additionalFilter: string, limit: number, sortby: string, platforms: string, genres: string, themes: string, gameModes: string): SearchConfig => {
	const searchConfig: SearchConfig = {
		method: 'post',
		url: `${process.env.API_ROOT_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}
	const formattedPlatformsQuery: string = platforms !== '' ? `query games "Platforms" {fields ${datafields}; where ${platforms} ${additionalFilter}; sort ${sortby}; limit ${limit};};` : ''
	const formattedGenresQuery: string = genres !== '' ? `query games "Genres" {fields ${datafields}; where ${genres} ${additionalFilter}; sort ${sortby}; limit ${limit};};` : ''
	const formattedThemesQuery: string = themes !== '' ? `query games "Themes" {fields ${datafields}; where ${themes} ${additionalFilter}; sort ${sortby}; limit ${limit};};` : ''
	const formattedGameModesQuery: string = gameModes !== '' ? `query games "Game Modes" {fields ${datafields}; where ${gameModes} ${additionalFilter}; sort ${sortby}; limit ${limit};};` : ''

	searchConfig.data = formattedPlatformsQuery + formattedGenresQuery + formattedThemesQuery + formattedGameModesQuery

	return searchConfig
}

const iterateResponse = (data: any[], type: string | undefined, toPush: string[]): string[] => {
	let arr: any[] = []
	if (toPush[0] === 'url' && toPush.length === 1) {
		for (let i = 0; i < data.length; i++) {
			arr.push(data[i].url)
		}
	}
	return arr
}

const splitIGDBSearch = (data: string[] | number[] | Categories[] | Languages[]) => {
	const dataStr: string[] = []
	const chunkSize = 10
	let chunkJoined: string
	for (let i = 0; i < data.length; i+= chunkSize) {
		const chunk = data.slice(i, i + chunkSize)
		chunkJoined = chunk.join(',')
		dataStr.push(chunkJoined)
	}
	return dataStr
}
const getExternalGamesIter = async (external_games: string[]) => {
	let searchResults: any
	let searchConfig: SearchConfig
	let arrOfUrls: Categories[] = []
	for (let i = 0; i < external_games.length; i++) {
		searchConfig = updateIGDBSearchConfig('external_games', 'category, url', external_games[i], 'category=(1,5,10,11,13,15,20,22,23,26,28,30,31,32,36,37,54,55)', false, '', 0, '')
		// searchConfig = updateIGDBSearchConfig('external_games', 'category, url', external_games[i], '', false, '', 0)
		await axios(searchConfig)
			.then((response) => {
				searchResults = response.data
				for (let i = 0; i < searchResults.length; i++) {
					if (searchResults[i].url) {
						arrOfUrls.push({
							category: searchResults[i].category,
							url: searchResults[i].url
						})
					}
				}
			})
			.catch((err) => {
				console.log(err)
			})
	}
	return arrOfUrls
}

const getPlatformLogosIter = async (platformlogos: string[]) => {
	let searchResults: any
	let searchConfig: SearchConfig
	let arrOfPlatformLogoUrls: any = []
	for (let i = 0; i < platformlogos.length; i++) {
		searchConfig = updateIGDBSearchConfig('platform_logos', 'url', platformlogos[i], '', false, '', 0, '')
		await axios(searchConfig)
			.then((response) => {
				searchResults = response.data
				for (let i = 0; i < searchResults.length; i++) {
					let searchResultOrig = searchResults[i]
					arrOfPlatformLogoUrls.push({
						...searchResultOrig,
						url: `https:${searchResults[i].url}`
					})
				}
			})
			.catch((err) => {
				console.log(err)
			})
	}
	return arrOfPlatformLogoUrls
}

const getLanguagesIter = async (language_supports: string[]) => {
	let searchResults: any
	let searchConfig: SearchConfig
	let arrOfLanguages: Languages[] = []
	for (let i = 0; i < language_supports.length; i++) {
		let currentArrOfLanguages: Languages[] = []
		searchConfig = updateIGDBSearchConfig('language_supports', 'language,language_support_type', language_supports[i], '', false, '', 0, '')
		let supporttypes = ''
		let languageids = ''
		await axios(searchConfig)
			.then((response) => {
				searchResults = response.data
				for (let i = 0; i < searchResults.length; i++) {
					currentArrOfLanguages.push({
						language: searchResults[i].language,
						language_support_type: searchResults[i].language_support_type === 1 ? 'Audio' : searchResults[i].language_support_type === 2 ? 'Subtitles' : 'Interface',
						marked: false,
						locale: '',
						native: ''
					})
					if (i === searchResults.length - 1) {
						supporttypes = supporttypes.concat(searchResults[i].language_support_type)
						languageids = languageids.concat(searchResults[i].language)
					}
					else {
						supporttypes = supporttypes.concat(`${searchResults[i].language_support_type},`)
						languageids = languageids.concat(`${searchResults[i].language},`)
					}
				}
			})
			.catch((err) => {
				console.log(err)
			})

		searchConfig = updateIGDBSearchConfig('language_support_types', 'name', supporttypes, '', false, '', 0, '')
		await axios(searchConfig)
			.then((response) => {
				searchResults = response.data
				for (let i = 0; i < searchResults.length; i++) {
					let objIndex = currentArrOfLanguages.findIndex((obj => obj.language_support_type === searchResults[i].id))
					let oldValAtIndex = currentArrOfLanguages[objIndex]
					currentArrOfLanguages[objIndex] = {
						...oldValAtIndex,
						language_support_type: searchResults[i].name
					}
				}

			})
			.catch((err) => {
				console.log(err)
			})

		searchConfig = updateIGDBSearchConfig('languages', 'locale,name,native_name', languageids, '', false, '', 0, '')
		await axios(searchConfig)
			.then((response) => {
				searchResults = response.data
				for (let i = 0; i < currentArrOfLanguages.length; i++) {
					let language = searchResults.filter((obj: { id: number }) => obj.id === currentArrOfLanguages[i].language)[0]
					let oldValAtIndex = currentArrOfLanguages[i]
					currentArrOfLanguages[i] = {
						...oldValAtIndex,
						language: language.name,
						locale: language.locale,
						native: language.native_name
					}
				}
			})
			.catch((err) => {
				console.log(err)
			})
		arrOfLanguages = arrOfLanguages.concat(currentArrOfLanguages)
	}
	return arrOfLanguages
}

const platformFamilyQuerified = (platform: string) => {
	const platformFamily = platformMap.get(platform)
	const platformStr = '& platforms=(' + platformFamily?.join(',') + ')'
	return platformStr
}

const parseBody = (requestBody: any): MultiSearchObj => {
	const { sortBy, sortDirection, externalFilter, nullable, platformFamily, limit, genres } = requestBody
	const sortJoined = `${sortMap.get(sortBy)} ${sortDirection}`
	const platformFamilyMapped = platformFamily !== '' ? platformFamilyQuerified(platformFamily) : ''
	const externalFilterJoined = externalFilter.concat(parseNullable(nullable), genres !== '' ? ` ${parseGenres(genres)}` : '')

	return {
		sortBy: sortJoined,
		externalFilter: externalFilterJoined,
		platformFamily : platformFamilyMapped,
		limit: limit
	}
}

const parseProfileBody = (requestBody: any): any => {
	const { sortBy, sortDirection, nullable, limit, platforms, genres, themes, gameModes } = requestBody
	const sortJoined = `${sortMap.get(sortBy)} ${sortDirection}`
	const nullableFormatted = parseNullable(nullable)
	const userPref: any = {
		platforms: retrieveFormattedMapID('platforms', platforms),
		genres: retrieveFormattedMapID('genres', genres),
		themes: retrieveFormattedMapID('themes', themes),
		gameModes: retrieveFormattedMapID('game_modes', gameModes)
	}

	return {
		sortBy: sortJoined,
		externalFilter: nullableFormatted,
		limit: limit,
		userPref: userPref
	}
}

const parseLargeBody = (requestBody: any): MultiSearchObj => {
	const { sortBy, sortDirection, externalFilter, nullable, limit, platforms, genres, themes, gameModes, categories, rating, releaseDate, companies } = requestBody
	const sortJoined = `${sortMap.get(sortBy)} ${sortDirection}`
	const nullableFormatted = parseNullable(nullable)
	const resultArray: string[] = [retrieveFormattedMapID('platforms', platforms), retrieveFormattedMapID('genres', genres), retrieveFormattedMapID('themes', themes), retrieveFormattedMapID('game_modes', gameModes), retrieveFormattedMapID('category', categories), retrieveRatingDateFormatted('total_rating', rating), retrieveRatingDateFormatted('first_release_date', releaseDate), retrieveFormattedMapID('involved_companies', companies)]
	const filteredResult: string = resultArray.filter((res: string) => res.length > 0).join(' & ')
	const externalFilterJoined = externalFilter !== '' ? externalFilter.concat(' & ', filteredResult, nullableFormatted) : filteredResult.concat(nullableFormatted)

	return {
		sortBy: sortJoined,
		externalFilter: externalFilterJoined,
		platformFamily: '',
		limit: limit
	}
}

const parseNullable = (nullableStr: string) => {
	const nullableArr: string[] = nullableStr.split(', ')
	let formattedString = ''
	for (let i = 0; i < nullableArr.length; i++) {
		formattedString = formattedString.concat(' & ', nullableArr[i], '!=n')
	}
	return formattedString
}

const parseGenres = (genres: string) => {
	let formattedString = '& genres=['
	if (!genres.includes(', ')) {
		formattedString = formattedString.concat(`${genreMap.get(genres)}]`)
		return formattedString
	}
	else {
		const genresArr: string[] = genres.split(', ')
		for (let i = 0; i < genresArr.length; i++) {
			formattedString = i !== genresArr.length - 1 ? formattedString.concat(`${genreMap.get(genresArr[i])}, `) : formattedString.concat(`${genreMap.get(genresArr[i])}]`)
		}
	}
	return formattedString
}

const populateSimilarGames = (gameArr: any[]): Explore[] => {
	if (!gameArr) {
		return [{ id: 0, age_ratings: [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }], cover: placeholderImages.NoArtworkScreenshotImage, platforms:  [{ name: 'None', category: 0, url: '', id: 0, platform_family: 0 }], rating: 0, ratingCount: 0, releaseDate: 'N/A', likes: 0, title: 'None', genres: [{ id: 0, name: 'Not provided' }], involved_companies: [{ name: 'None', url: '', officialSite: '' }] }]
	}
	let gameObjArr: Explore[] = []
	for (let i = 0; i < gameArr.length; i++) {
		const indGameObj: Explore = {
			id: gameArr[i].id,
			age_ratings: gameArr[i].age_ratings !== undefined ? gameArr[i].age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
			cover: gameArr[i].cover ? `https:${gameArr[i].cover.url.replace('thumb', '1080p')}` : placeholderImages.NoArtworkScreenshotImage,
			platforms: gameArr[i].platforms ? gameArr[i].platforms.map((indPlatform: any) => ({
				name: indPlatform.name,
				category: indPlatform.category,
				url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
				id: indPlatform.id,
				platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
			})) : [{ name: 'None', category: 0, url: '', id: 0, platform_family: 0 }],
			rating: gameArr[i].total_rating ? gameArr[i].total_rating : 0,
			ratingCount: gameArr[i].total_rating_count ? gameArr[i].total_rating_count : 0,
			releaseDate: gameArr[i].first_release_date ? new Date(gameArr[i].first_release_date*1000) : 'N/A',
			likes: gameArr[i].follows ? gameArr[i].follows : 0,
			title: gameArr[i].name ? gameArr[i].name : 'None',
			genres: gameArr[i].genres ? gameArr[i].genres : [{ id: 0, name: 'Not provided' }],
			involved_companies: gameArr[i].involved_companies ? gameArr[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
				name: indCompany.company.name,
				url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
				officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : '' })) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }]
		}
		const ageRatingsobj: AgeRatings = {
			'ESRB': indGameObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1).length !== 0 ? indGameObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1)[0].rating : 0,
			'PEGI': indGameObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2).length !== 0 ? indGameObj.age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 2)[0].rating : 0
		}
		indGameObj.age_ratings = ageRatingsobj
		gameObjArr!.push(indGameObj)
	}
	return gameObjArr!
}

const populateSearchItems = (searchArr: any[]): SearchObj[] => {
	let searchObjArr: SearchObj[] = []
	for (let i = 0; i < searchArr.length; i++) {
		const indSearchObj: SearchObj = {
			id: searchArr[i].id,
			category: categoryMap.get(searchArr[i].category),
			cover: searchArr[i].cover ? `https:${searchArr[i].cover.url.replace('thumb', '1080p')}` : placeholderImages.NoArtworkScreenshotImage,
			releaseDate: searchArr[i].first_release_date ? new Date(searchArr[i].first_release_date*1000) : 'N/A',
			likes: searchArr[i].follows ? searchArr[i].follows : 0,
			involved_companies: searchArr[i].involved_companies ? searchArr[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
				name: indCompany.company.name,
				url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
				officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : ''
			})) : [{ name: 'No Developer/Publisher', url: '', officialSite: '' }],
			title: searchArr[i].name ? searchArr[i].name : 'Unknown Title',
			platforms: searchArr[i].platforms ? searchArr[i].platforms.map((indPlatform: any) => ({
				name: indPlatform.name,
				category: indPlatform.category,
				url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
				id: indPlatform.id,
				platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
			})): [{ name: 'None', category: 0, url: '', id: 0, platform_family: 0 }],
			rating: searchArr[i].total_rating ? searchArr[i].total_rating : 0
		}
		searchObjArr!.push(indSearchObj)
	}
	return searchObjArr!
}

const populateCompanySearch = (searchArr: any[]): Companies[] => {
	let companyObjArr: Companies[] = []
	for (let i = 0; i < searchArr.length; i++) {
		const indCompanySearchObj: Companies = {
			name: searchArr[i].name,
			url: searchArr[i].logo ? `https:${searchArr[i].logo.url}` : '',
			officialSite: searchArr[i].websites ? searchArr[i].websites.filter((web: any) => web.category === 1)[0].url : ''
		}
		companyObjArr!.push(indCompanySearchObj)
	}
	return companyObjArr!
}

const categoriesCheck = (category: string, src: number) => {
	return category === 'External' ? ExternalCategories.map((indExternal: any) => indExternal.source).includes(src) : WebsiteCategories.map((indWeb: any) => indWeb.source).includes(src)
}

const errorHandleMiddleware = (requestBaseUrl: string, body: any, response: Response) => {
	const requestRoute = requestBaseUrl.replace('/api/','')

	switch (requestRoute) {
	case 'explore':
		if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
			response.status(400).json({
				error: `No sort specified: ${body.sortBy}`
			})
		}
		else if (body.sortDirection === null || body.sortDirection === '' || !body.sortDirection) {
			response.status(400).json({
				error: `No sort direction specified: ${body.sortDirection}`
			})
		}
		else if (body.externalFilter === null || body.externalFilter === '' || !body.externalFilter) {
			response.status(400).json({
				error: `No filter specified: ${body.sortBy}`
			})
		}
		else if (body.limit === null || body.limit === 0 || !body.limit) {
			response.status(400).json({
				error: `No limit specified or limit equal to: ${body.limit}`
			})
		}
		break
	case 'overview':
		if (body.searchterm === '' || !body.searchterm) {
			response.status(400).json({
				error: 'No search term specified'
			})
		}
		break
	case 'advsearch':
		if (body.sortBy === null || body.sortBy === '' || !body.sortBy) {
			response.status(400).json({
				error: `No sort specified: ${body.sortBy}`
			})
		}
		else if (body.sortDirection === null || body.sortDirection === '' || !body.sortDirection) {
			response.status(400).json({
				error: `No sort direction specified: ${body.sortDirection}`
			})
		}
		else if (body.limit === null || body.limit === '' || !body.limit) {
			response.status(400).json({
				error: `No limit specified or limit equal to: ${body.limit}`
			})
		}
		else if (body.rating === null || body.rating.length !== 2 || !body.rating) {
			response.status(400).json({
				error: `No rating range provided to: ${body.rating}`
			})
		}
		else if (body.releaseDate === null || body.releaseDate.length !== 2 || !body.releaseDate) {
			response.status(400).json({
				error: `No release date range provided to: ${body.rating}`
			})
		}
		else if (body.nullable === null || body.nullable === '' || !body.nullable) {
			response.status(400).json({
				error: `No non-null fields specified: ${body.nullable}`
			})
		}
		break
	default:
		if (body.gameid === null || !body.gameid) {
			response.status(400).json({
				error: `No game id specified: ${body.gameid}`
			})
		}
	}
}

const retrieveFormattedMapID = (specified: string, input: string[]) => {
	let formattedID: string = ''

	if (input.length === 0) {
		return formattedID
	}
	else {
		formattedID = `${specified}=(`
		switch (specified) {
		case 'platforms':
			if (input.length === 1) {
				formattedID = formattedID.concat(`${platformSpecificMap.get(input[0])})`)
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID = formattedID.concat(`${platformSpecificMap.get(input[i])})`) : formattedID.concat(`${platformSpecificMap.get(input[i])},`)
				}
			}
			break
		case 'genres':
			if (input.length === 1) {
				formattedID = formattedID.concat(`${genreMap.get(input[0])})`)
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID = formattedID.concat(`${genreMap.get(input[i])})`) : formattedID.concat(`${genreMap.get(input[i])},`)
				}
			}
			break
		case 'themes':
			if (input.length === 1) {
				formattedID = formattedID.concat(`${themeMap.get(input[0])})`)
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID = formattedID.concat(`${themeMap.get(input[i])})`) : formattedID.concat(`${themeMap.get(input[i])},`)
				}
			}
			break
		case 'game_modes':
			if (input.length === 1) {
				formattedID = formattedID.concat(`${gameModeMap.get(input[0])})`)
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID = formattedID.concat(`${gameModeMap.get(input[i])})`) : formattedID.concat(`${gameModeMap.get(input[i])},`)
				}
			}
			break
		case 'category':
			if (input.length === 1) {
				formattedID = formattedID.concat(`${categorySpecificMap.get(input[0])})`)
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID = formattedID.concat(`${categorySpecificMap.get(input[i])})`) : formattedID.concat(`${categorySpecificMap.get(input[i])},`)
				}
			}
			break
		case 'involved_companies':
			formattedID = ''
			if (input.length === 1) {
				formattedID = `${specified}.company.name="${input[0]}"`
			}
			else {
				for (let i = 0; i < input.length; i++) {
					formattedID = i === input.length - 1 ? formattedID.concat(`${specified}.company.name="${input[i]}"`) : formattedID.concat(`${specified}.company.name="${input[i]}" | `)
				}
				formattedID = `(${formattedID})`
			}
			break
		default:
			return ''
		}
	}
	return formattedID
}

const retrieveRatingDateFormatted = (specified: string, input: number[]) => {
	let formatted: string = ''
	switch (specified) {
	case 'total_rating':
		formatted = formatted.concat(`${specified} >= ${input[0]} & ${specified} <= ${input[1]}`)
		break
	case 'first_release_date':
		const stringStartYearDate = `${input[0]}.01.01`
		const stringEndYearDate = `${input[1]}.12.31`
		formatted = formatted.concat(`${specified} >= ${Math.floor(new Date(stringStartYearDate).getTime() / 1000)} & ${specified} <= ${Math.ceil(new Date(stringEndYearDate).getTime() / 1000)}`)
		break
	default:
		return ''
	}
	return formatted
}

const stringArrayToPostgresArray = (inputArray: string[]) => {
	let stringifiedArray = JSON.stringify(inputArray)
	stringifiedArray = stringifiedArray.replace('[', '').replace(']', '')
	return `{${stringifiedArray}}`
}

const objectArrayToPostgresArray = (inputArray: any[]) => {
	let stringifiedArray = JSON.stringify(inputArray)
	stringifiedArray = stringifiedArray.replace('[', '').replace(']', '')
	return `{${stringifiedArray}}`
}

export { requestLogger, corsOptions, updateIGDBSearchConfig, updateIGDBSearchConfigMulti, updateIGDBSearchConfigSpec, updateIGDBSearchConfigMultiProfile, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, getPlatformLogosIter, platformFamilyQuerified, parseBody, parseLargeBody, parseNullable, populateSimilarGames, categoriesCheck, errorHandleMiddleware, populateSearchItems, populateCompanySearch, retrieveFormattedMapID, retrieveRatingDateFormatted, stringArrayToPostgresArray, objectArrayToPostgresArray, parseProfileBody, Videos }
