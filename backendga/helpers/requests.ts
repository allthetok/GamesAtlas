/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios'
import { Request, Response, NextFunction } from 'express'
require('dotenv').config()

type SearchConfig = {
	method: string,
	url: string,
	headers: object,
	data: string
}

type GameDetailObj = {
	id: number | null,
	age_ratings: string | AgeRatings,
	artworks: string | string[],
	cover: number | string | null,
	external_games: string[] | Categories[],
	game_modes: string | string[],
	genres: string | string[],
	hypes: number | null,
	involved_companies: string | Companies[],
	keywords: string | string[],
	platforms: string | Platforms[],
	player_perspectives: string | string[],
	screenshots: string | string[],
	similar_games: string | string[] | Covers[],
	tags: string,
	themes: string | string[],
	videos: string | Videos[],
	websites: string | Categories[],
	language_supports: string[] | Languages[],
	game_localizations: string,
	rating: number | null,
	ratingCount: number | null,
	releaseDate: Date | null,
	likes: number | null,
	title: string,
	story: string,
	summary: string,
	url: string
}

type OverviewObj = {
	id: number | null,
	age_ratings: string | AgeRatings,
	cover: number | string | null,
	external_games: string[] | Categories[],
	game_modes: string | string[],
	genres: string | string[],
	hypes: number | null,
	involved_companies: string | Companies[],
	keywords: string | string[],
	platforms: string | Platforms[],
	player_perspectives: string | string[],
	tags: string,
	themes: string | string[],
	websites: string | Categories[],
	game_localizations: string,
	rating: number | null,
	ratingCount: number | null,
	releaseDate: Date | null,
	likes: number | null,
	title: string,
	story: string,
	summary: string,
	url: string
}

type ArtworkObj = {
	artworks: string | string[]
}

type LanguageObj = {
	language_supports: string[] | Languages[]
}

type ScreenshotsObj = {
	screenshots: string[],
}

type SimilarObj = {
	similar_games: string | string[] | Covers[]
}

type VideoObj = {
	videos: string | Videos[]
}

type WebsiteObj = {
	websites: string | Categories[]
}

type ExploreObj = {
	id: number | null,
	age_ratings: string | AgeRatings,
	cover: number | string | null,
	platforms: string | Platforms[],
	rating: number | null,
	ratingCount: number | null,
	releaseDate: Date | null,
	likes: number | null,
	title: string
}

type AgeRatings = {
	'ESRB': number,
	'PEGI': number
}

type Categories = {
	'category': number,
	'url': string
}

type Companies = {
	'name': string,
	'logoid': number,
	'url': string
}

type Platforms = {
	'name': string,
	'category': number,
	'platform_logo': number,
	'url': string
}

type Videos = {
	'name': string,
	'ytlink': string
}

type Languages = {
	'language': string | number,
	'language_support_type': string,
	'marked': boolean,
	'locale': string,
	'native': string
}

type Covers = {
	'name': string,
	'cover': string | number
}




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

const iterateResponse = (data: any[], type: string | undefined, toPush: string[]): string[] => {
	let arr: any[] = []
	if (toPush[0] === 'url' && toPush.length === 1) {
		for (let i = 0; i < data.length; i++) {
			arr.push(data[i].url)
		}
	}
	return arr
}

const splitIGDBSearch = (data: string[] | Categories[] | Languages[]) => {
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






export { requestLogger, corsOptions, updateIGDBSearchConfig, SearchConfig, GameDetailObj, AgeRatings, Categories, Companies, Platforms, Videos, Languages, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, Covers, OverviewObj, ArtworkObj, LanguageObj, VideoObj, ScreenshotsObj, WebsiteObj, SimilarObj, ExploreObj }
