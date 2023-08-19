/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
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
	external_games: string | Categories[],
	game_modes: string,
	genres: string | string[],
	hypes: number | null,
	involved_companies: string | Companies[],
	keywords: string | string[],
	platforms: string | Platforms[],
	player_perspectives: string,
	screenshots: string | string[],
	similar_games: string | string[],
	tags: string,
	themes: string | string[],
	videos: string | Videos[],
	websites: string | Categories[],
	language_supports: string | Languages[],
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

const updateIGDBSearchConfig = (endpoint: string, datafields: string, stringofids: any, additionalfilter: string, search: boolean, searchterm: string, limit: number): SearchConfig => {
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
	else {
		searchConfig.data = `fields ${datafields}; where id=(${stringofids})${additionalfilter !== '' ? ` & ${additionalfilter}` : ''};`
	}
	return searchConfig
}

const iterateResponse = (data: any[], type: string | undefined, toPush: string[]): string[] => {
	console.log(data)
	let arr: any[] = []
	if (toPush[0] === 'url' && toPush.length === 1) {
		for (let i = 0; i < data.length; i++) {
			arr.push(data[i].url)
		}
	}
	return arr
}



export { requestLogger, corsOptions, updateIGDBSearchConfig, SearchConfig, GameDetailObj, AgeRatings, Categories, Companies, Platforms, Videos, Languages, iterateResponse }
