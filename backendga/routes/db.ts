/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Request, Response } from 'express'
import { pool } from '../src/db'
import SQL from 'sql-template-strings'

require('dotenv').config()
const router = express.Router()

router.get('/createUser', async (request: Request, response: Response) => {
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

router.get('/createProfile', async (request: Request, response: Response) => {
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

router.get('/createLikes', async (request: Request, response: Response) => {
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

router.get('/createRecommend', async (request: Request, response: Response) => {
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

router.get('/createUserCode', async (request: Request, response: Response) => {
	await pool.query(SQL`
		CREATE TABLE usercode
			( verificationCode VARCHAR(100) NOT NULL,
			  verifyid SERIAL PRIMARY KEY,
			  userid INT NOT NULL,
			  email VARCHAR(100) NOT NULL,
			  dateCreated TIMESTAMP,
			  CONSTRAINT FOREIGN_USER FOREIGN KEY(userid) REFERENCES users(id) )`)
		.then(() => {
			return response.status(200).json({
				Message: 'Successfully created table: usercode'
			})
		})
		.catch((err: any) => {
			console.log(err)
			return response.status(500).json({
				error: 'Unable to create table: usercode'
			})
		})
})

export { router }