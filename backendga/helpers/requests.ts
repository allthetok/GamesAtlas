/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios'
import { Request, Response, NextFunction } from 'express'
import { AgeRatings, MultiSearchObj, ArtworkObj, Categories, Companies, Covers, Explore, GameDetailObj, LanguageObj, Languages, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SimilarObj, VideoObj, Videos, WebsiteObj } from './betypes'
import { sortMap, platformMap, genreMap } from '../helpers/enums'
import { ExternalCategories, WebsiteCategories } from '../../frontendga/assets/ratingsvglinks'
require('dotenv').config()

const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
	console.log('Method:', request.method)
	console.log('Path: ', request.url)
	console.log('Body: ', request.body)
	console.log('---')
	next()
}

const corsOptions = {
	origin: 'http://localhost:3000',
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
		searchConfig.data = `search "${searchterm}"; fields ${datafields}; ${limit !== 0 ? ` limit ${limit};` : ''}`
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

	// searchConfig.data = `query games "Filtered ${limit}" {fields ${datafields}; ${additionalfilter !== '' ? `where ${additionalfilter};` : ''} sort ${sortby}; limit ${limit};};`
	console.log(searchConfig)
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
	let gameObjArr: Explore[] = []
	for (let i = 0; i < gameArr.length; i++) {
		const indGameObj: Explore = {
			id: gameArr[i].id,
			age_ratings: gameArr[i].age_ratings !== undefined ? gameArr[i].age_ratings.filter((ageRatingObj: any) => ageRatingObj.category === 1 || ageRatingObj.category === 2) : [{ id: 0, category: 1, rating: 0 }, { id: 0, category: 2, rating: 0 }],
			cover: `https:${gameArr[i].cover.url.replace('thumb', '1080p')}`,
			platforms: gameArr[i].platforms.map((indPlatform: any) => ({
				name: indPlatform.name,
				category: indPlatform.category,
				url: indPlatform.platform_logo ? `https:${indPlatform.platform_logo.url}` : '',
				id: indPlatform.id,
				platform_family: indPlatform.platform_family ? indPlatform.platform_family : 0,
			})),
			rating: gameArr[i].total_rating,
			ratingCount: gameArr[i].total_rating_count,
			releaseDate: new Date(gameArr[i].first_release_date*1000),
			likes: gameArr[i].follows,
			title: gameArr[i].name,
			genres: gameArr[i].genres,
			involved_companies: gameArr[i].involved_companies.filter((company: any) => company.developer === true).map((indCompany: any) => ({
				name: indCompany.company.name,
				url: indCompany.company.logo ? `https:${indCompany.company.logo.url}` : '',
				officialSite: indCompany.company.websites && indCompany.company.websites.filter((site: any) => site.category === 1).length === 1 ? indCompany.company.websites.filter((site: any) => site.category === 1)[0].url : '' }))
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

const categoriesCheck = (category: string, src: number) => {
	return category === 'External' ? ExternalCategories.map((indExternal: any) => indExternal.source).includes(src) : WebsiteCategories.map((indWeb: any) => indWeb.source).includes(src)
}

export { requestLogger, corsOptions, updateIGDBSearchConfig, updateIGDBSearchConfigMulti, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, getPlatformLogosIter, platformFamilyQuerified, parseBody, parseNullable, populateSimilarGames, categoriesCheck }
