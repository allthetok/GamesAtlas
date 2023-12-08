/* eslint-disable no-case-declarations */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import express, { Request, Response } from 'express'
import { pool } from '../src/db'
import { transport, generateVerificationCode } from '../src/transport'
import axios from 'axios'
import SQL, { SQLStatement } from 'sql-template-strings'
import nodemailer from 'nodemailer'
import { updateIGDBSearchConfig, populateSimilarGames, parseProfileBody, updateIGDBSearchConfigMultiProfile, stringArrayToPostgresArray } from '../helpers/requests'
import { hashPassword, authPassword } from '../helpers/auth'
import { Explore, Mail, SearchConfig } from '../helpers/betypes'
require('dotenv').config()
const router = express.Router()

const transporter = nodemailer.createTransport(transport)
transporter.verify((error: Error | null, success: true): void => {
	if (error) {
		console.error(error)
	}
	else {
		console.log('Connected to transporter')
	}
})

router.post('/createUser', async (request: Request, response: Response) => {
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

router.post('/loginOAuthUser', async (request: Request, response: Response) => {
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
			WHERE userid = ${userId!}`)
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

// router.post('/check', async (request: Request, response: Response) => {
// 	const body = request.body
// 	let queryResult: any

// 	await pool.query(SQL`
// 		SELECT * FROM users u
// 			WHERE u.email=${body.email}
// 			AND u.provider=${body.provider}`)
// 		.then((response: any) => {
// 			queryResult = response.rows[0]
// 		})
// 		.catch((err: any) => {
// 			console.log(err)
// 			return response.status(404).json({
// 				error: `Failed to retrieve records within users and userprofiles tables`
// 			})
// 		})

// 	return response.status(200).json(queryResult)
// })

// router.post('/check2user', async (request: Request, response: Response) => {
// 	const body = request.body
// 	let queryResult: any

// 	await pool.query(SQL`
// 		SELECT * FROM users u
// 			WHERE u.id = ${body.userid}`)
// 		.then((response: any) => {
// 			queryResult = response.rows[0]
// 		})
// 		.catch((err: any) => {
// 			console.log(err)
// 			return response.status(404).json({
// 				error: `Failed to retrieve records within users and userprofiles tables`
// 			})
// 		})

// 	return response.status(200).json(queryResult)
// })

router.post('/resolveUser', async (request: Request, response: Response) => {
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

router.post('/login', async (request: Request, response: Response) => {
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

router.post('/profileDetails', async (request: Request, response: Response) => {
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

router.post('/userDetails', async (request: Request, response: Response) => {
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

router.patch('/profileDetails', async (request: Request, response: Response) => {
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
		platforms: stringArrayToPostgresArray(platforms),
		genres: stringArrayToPostgresArray(genres),
		themes: stringArrayToPostgresArray(themes),
		gameModes: stringArrayToPostgresArray(gameModes)
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

router.patch('/userDetails', async (request: Request, response: Response) => {
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

router.post('/usernameEmail', async (request: Request, response: Response) => {
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

router.post('/recommendPrefs', async (request: Request, response: Response) => {
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

router.post('/userLike', async (request: Request, response: Response) => {
	const body = request.body
	const userid: number = body.userid
	const gameid: number = body.gameid
	let gameExploreFormat: any = body.game
	let similarExploreFormat: any = body.similargames
	let queryLikeResult: any
	let queryResult: any
	let likeExists: boolean = false
	let recommendExists: boolean = false
	let searchResults: any
	let errSearch = false

	if (!userid || userid === null || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (!gameid || gameid === null || gameid === undefined) {
		return response.status(400).json({
			error: 'No gameid provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT ul.* from userlikes ul
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
	if (gameExploreFormat === null) {
		let searchConfig: SearchConfig
		let responseObj: Explore
		let intermediaryGameExplore: any
		searchConfig = updateIGDBSearchConfig('games', 'id,age_ratings.category,age_ratings.rating,category,cover.url,first_release_date,follows,genres.name,involved_companies,name,platforms.name,platforms.category,platforms.platform_logo.url,platforms.platform_family,total_rating,total_rating_count,themes.name,involved_companies.company.name, involved_companies.company.logo.url, involved_companies.developer, involved_companies.company.websites.url, involved_companies.company.websites.category', gameid, '', false, '', 0, '')
		await axios(searchConfig)
			.then((response: any) => {
				searchResults = response.data
				intermediaryGameExplore = populateSimilarGames(searchResults)
				gameExploreFormat = intermediaryGameExplore[0]
			})
			.catch((err: any) => {
				errSearch = true
				console.log(err)
			})
		console.log(gameExploreFormat)
		if (errSearch) {
			return response.status(404).json({
				Message: `Unable to retrieve game object for game id: ${gameid}`
			})
		}
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
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to insert record for userid: ${userid} on this game: ${gameid}`
			})
		})
	if (queryLikeResult !== null) {
		await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT lr.* from likesrecommend lr
				WHERE lr.igdbid = ${gameid} )`)
			.then((response: any) => {
				if (response.rows.length !== 0) {
					recommendExists = !recommendExists
				}
			})
			.catch((err: any) => {
				console.log(err)
				return response.status(404).json({
					error: `Failed to check if this gameid: ${gameid} record already exists in recommendation table`
				})
			})

		if (!recommendExists) {
			if (similarExploreFormat === null) {
				let searchConfig: SearchConfig
				let responseObj: { similar_games: Explore[]}
				searchConfig = updateIGDBSearchConfig('games', 'id,similar_games.name,similar_games.id,similar_games.age_ratings.category,similar_games.age_ratings.rating,similar_games.cover.url,similar_games.platforms.name,similar_games.platforms.category,similar_games.platforms.platform_logo.url,similar_games.platforms.platform_family,similar_games.first_release_date,similar_games.follows,similar_games.name,similar_games.total_rating,similar_games.total_rating_count, similar_games.genres.name, similar_games.involved_companies.company.name, similar_games.involved_companies.company.logo.url, similar_games.involved_companies.developer, similar_games.involved_companies.company.websites.url, similar_games.involved_companies.company.websites.category', gameid, '', false, '', 0, '')
				await axios(searchConfig)
					.then((response: any) => {
						searchResults = response.data[0]
						console.log(response.data[0])
						responseObj = {
							similar_games: populateSimilarGames(searchResults.similar_games)
						}
					})
					.catch((err: any) => {
						errSearch = true
						console.log(err)
					})
				console.log(responseObj!.similar_games)
				similarExploreFormat = responseObj!.similar_games
				if (errSearch) {
					return response.status(404).json({
						Message: `Unable to retrieve similar games for game id: ${gameid}`
					})
				}
			}
			await pool.query(SQL`
				INSERT INTO likesrecommend 
				(igdbid, recommendobjarr)
				VALUES (${gameid}, ${similarExploreFormat})
				RETURNING igdbid, recommendobjarr`)
				.then((response: any) => {
					queryResult = {
						...queryLikeResult,
						recommendObj: response.rows[0].recommendobjarr
					}
				})
				.catch((err: any) => {
					console.log(err)
					return response.status(404).json({
						error: `Failed to insert recommendations for game: ${gameid}`
					})
				})
			return response.status(200).json(queryResult)
		}
		else {
			return response.status(200).json({
				message: `Successfully inserted record into userlikes table, record already exists in recommendation table`
			})
		}
	}
})

router.delete('/userLike', async (request: Request, response: Response) => {
	const body = request.body
	const userid: number = body.userid
	const gameid: number = body.gameid
	let likeExists: boolean
	let success: boolean = false

	if (!userid || userid === null || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}
	else if (!gameid || gameid === null || gameid === undefined) {
		return response.status(400).json({
			error: 'No gameid provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT ul.* from userlikes ul
				WHERE ul.userid = ${userid} AND ul.gameid = ${gameid})`)
		.then((response: any) => {
			likeExists = response.rows.length !== 0
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to check if record exists for userid: ${userid} on this game: ${gameid}`
			})
		})
	if (!likeExists!) {
		return response.status(400).json({
			error: `This game has not been liked by user: ${userid}`
		})
	}

	await pool.query(SQL`
		DELETE FROM userlikes 
		WHERE userid = ${userid} AND gameid = ${gameid}`)
		.then((response: any) => {
			success = response.rowCount === 1
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				Message: `Failed to delete like for game: ${gameid} on user: ${userid}`
			})
		})
	return success ? response.status(200).json({ Message: `Successfully deleted like for game: ${gameid} on user: ${userid}` }) : response.status(404).json({ Message: `Unable to delete like for game: ${gameid} on user: ${userid}` })
})

router.delete('/likeRecommend', async (request: Request, response: Response) => {
	const body = request.body
	const gameid: number = body.gameid
	let likeExists: boolean
	let success: boolean = false

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT lr.* from likesrecommend lr
				WHERE lr.igdbid = ${gameid})`)
		.then((response: any) => {
			likeExists = response.rows.length !== 0
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to check if record exists for game: ${gameid} in recommendation table`
			})
		})
	if (!likeExists!) {
		return response.status(400).json({
			error: `This game doesn't exist in recommendations: ${gameid}`
		})
	}

	await pool.query(SQL`
		DELETE FROM likesrecommend 
		WHERE igdbid = ${gameid}`)
		.then((response: any) => {
			success = response.rowCount === 1
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				Message: `Failed to delete recommendation record for game: ${gameid}`
			})
		})
	return success ? response.status(200).json({ Message: `Successfully deleted recommendation record for game: ${gameid}` }) : response.status(404).json({ Message: `Failed to delete recommendation record for game: ${gameid}` })
})

router.post('/likeRecommend', async (request: Request, response: Response) => {
	const body = request.body
	const gameid: number = body.gameid
	const similarExploreFormat: any = body.similargames
	let queryResult: any

	await pool.query(SQL`
				INSERT INTO likesrecommend 
				(igdbid, recommendobjarr)
				VALUES (${gameid}, ${similarExploreFormat})
				RETURNING igdbid, recommendobjarr`)
		.then((response: any) => {
			console.log(response)
			console.log(response.rows[0])
			queryResult = response.rows[0]
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to insert recommendations for game: ${gameid}`
			})
		})
	return response.status(200).json(queryResult)
})

router.post('/recommendLikes', async (request: Request, response: Response) => {
	const body = request.body
	const userid: number = body.userid
	let queryResult: any
	let likeExists: any = true

	if (!userid || userid === null || userid === undefined) {
		return response.status(400).json({
			error: 'No userid provided'
		})
	}

	await pool.query(SQL`
		SELECT 1 WHERE EXISTS
			(SELECT ul.* from userlikes ul
				WHERE ul.userid = ${userid})`)
		.then((response: any) => {
			if (response.rows.length === 0) {
				likeExists = !likeExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: 'Failed to retrieve records from userlikes'
			})
		})
	if (!likeExists) {
		return response.status(400).json({
			error: `This user: ${userid} has not liked any games and hence has no recommendations`
		})
	}

	await pool.query(SQL`
		SELECT lr.recommendobjarr FROM userlikes ul
		INNER JOIN likesrecommend lr
		ON ul.gameid = lr.igdbid
		WHERE ul.userid = ${userid}`)
		.then((response: any) => {
			queryResult = response.rows
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: `Failed to retrieve records from userlikes and likesrecommend tables`
			})
		})
	return queryResult !== null ? response.status(200).json(queryResult) : response.status(400).json({ error: `This user: ${userid} has not liked any games and hence has no recommendations` })
})

router.post('/userLikes', async (request: Request, response: Response) => {
	const body = request.body
	const userid: number = body.userid
	let queryResult: any
	let recordsExists: any = true

	if (userid === null || !userid || userid === undefined) {
		return response.status(400).json({
			error: `No userid provided: ${userid}`
		})
	}

	await pool.query(SQL`
		SELECT ul.likeid, ul.gameobj from userlikes ul
		WHERE ul.userid = ${userid}`)
		.then((response: any) => {
			queryResult = response.rows
			if (response.rows.length === 0) {
				recordsExists = !recordsExists
			}
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(404).json({
				error: 'Failed to retrieve records from userlikes'
			})
		})

	return recordsExists ? response.status(200).json(queryResult) : response.status(400).json({ error: `This user: ${userid} has not liked any games and hence has no recommendations` })
})

router.post('/verificationCode', async (request: Request, response: Response) => {
	const body = request.body
	const email = body.email
	let userid: number
	let profileid: number
	let queryResult: any

	const verificationCodeGenerated: number = generateVerificationCode()
	const mail: Mail = {
		from: process.env.SMTP_FROM_EMAIL || 'noreply.gamesatlas@gmail.com',
		to: email,
		subject: 'Verification Code from GamesAtlas',
		text: `Hello, Your GamesAtlas Verification Code is: ${verificationCodeGenerated} . Please do not respond to this email`
	}

	transporter.sendMail(mail, (err: Error | null, data) => {
		if (err) {
			return response.status(400).json({
				status: 'fail',
			})
		}
	})

	await pool.query(SQL`
		SELECT u.id, up.profileid FROM users u 
		INNER JOIN userprofiles up 
		ON u.id = up.userid
		WHERE u.email=${email} AND u.provider='GamesAtlas' `)
		.then((response: any) => {
			userid = response.rows[0].id
			profileid = response.rows[0].id
		})
		.catch((err: any) => {
			return response.status(400).json({ error: `Failed to query users table for userid on email: ${email}` })
		})

	await pool.query(SQL`
		INSERT INTO usercode
			(verificationCode, userid, email, dateCreated)
			VALUES (${String(verificationCodeGenerated)}, ${userid!}, ${email}, to_timestamp(${Date.now()} / 1000.0))
		RETURNING dateCreated
		`)
		.then((response: any) => {
			queryResult = response.rows.length !== 0 ? response.rows[0] : null
		})
		.catch((err: any) => {
			console.log(err)
			queryResult = null
		})

	return queryResult === null ? response.status(400).json({ error: `Failed to generate a verification code for: ${email}` }) : response.status(200).json({ userid: userid!, profileid: profileid! })
})

router.post('/resolveCode', async (request: Request, response: Response) => {
	const body = request.body
	const email = body.email
	let queryResult: any

	await pool.query(SQL`
		SELECT verificationCode
		FROM usercode 
		WHERE email=${email}
		ORDER BY dateCreated DESC `)
		.then((response: any) => {
			queryResult = response.rows.length !== 0 ? response.rows[0]: null
		})
		.catch((err: any) => {
			queryResult = null
		})
	return queryResult === null ? response.status(400).json({ error: `Unable to retrieve verificationCode from usercode table for: ${email}` }) : response.status(200).json(queryResult)
})

export { router }