import { Request, Response, NextFunction } from 'express'
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

type SearchConfig = {
	method: string,
	url: string,
	headers: object,
	data: string
} 

const updateIGDBSearchConfig = (method: string, endpoint: string, datafields: string, stringofids: string, additionalfilter: string, search: boolean, searchterm: string, limit: number): SearchConfig => {
	let searchConfig: SearchConfig = {
		method,
		url: `${process.env.API_ROOT_URL}${endpoint}`,
		headers: {
			'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
			'Client-ID': process.env.CLIENT_ID,
			'Content-Type': 'text/plain',
			'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
		},
		data: ''
	}
	// searchConfig = {
	// 	method,
	// 	url: `${process.env.API_ROOT_URL}${endpoint}`,
	// 	headers: {
	// 		'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
	// 		'Client-ID': process.env.CLIENT_ID,
	// 		'Content-Type': 'text/plain',
	// 		'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
	// 	},
	// 	data: ''
	// }
	if (search) {
		searchConfig.data = `search "${searchterm}"; fields ${datafields}; ${limit !== 0 ? ` limit ${limit};` : null}`
	}
	else {
		searchConfig.data = `fields ${datafields}; where id=(${stringofids}) ${additionalfilter !== '' ? ` & ${additionalfilter}` : ''};`
	}
	// return {
	// 	method,
	// 	url: `${process.env.API_ROOT_URL}${endpoint}`,
	// 	headers: {
	// 		'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
	// 		'Client-ID': process.env.CLIENT_ID,
	// 		'Content-Type': 'text/plain',
	// 		'Cookie': '__cf_bm=Utg5TKlZGdxCgCn2UeuGW.LLOCZm6oHCCazU5AOMZjM-1692063194-0-AUdu+e0vn6rY+xWhK86IVLzsp03BXN3Wgq3P2CkRrTl56PwoVdQdbQaa1ysHtYnuWmX/WNREfgqIMVkEQEc9AEs='
	// 	},
	// 	data: `fields ${datafields}; where id=(${stringofids}) ${additionalfilter !== '' ? ` & ${additionalfilter}` : ''};`
	// }
	return searchConfig
}

export { requestLogger, corsOptions, updateIGDBSearchConfig, SearchConfig }