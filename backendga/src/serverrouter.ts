/* eslint-disable no-case-declarations */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { requestLogger, corsOptions, updateIGDBSearchConfig, iterateResponse, splitIGDBSearch, getExternalGamesIter, getLanguagesIter, updateIGDBSearchConfigMulti, getPlatformLogosIter, platformFamilyQuerified, parseBody, populateSimilarGames, categoriesCheck, errorHandleMiddleware, populateSearchItems, updateIGDBSearchConfigSpec, populateCompanySearch, retrieveFormattedMapID, parseNullable, retrieveRatingDateFormatted, parseLargeBody, parseProfileBody, updateIGDBSearchConfigMultiProfile, stringArrayToPostgresArray } from '../helpers/requests'
import { hashPassword, authPassword } from '../helpers/auth'
import { AgeRatings, ArtworkObj, Categories, Companies, Covers, Explore, GameDetailObj, GameObj, GlobalAuxiliaryObj, LanguageObj, Languages, Mail, OverviewObj, Platforms, ScreenshotsObj, SearchConfig, SearchObj, SimilarGamesObj, SimilarObj, VideoObj, Videos, WebsiteObj } from '../helpers/betypes'
import { ExternalCategories, WebsiteCategories, placeholderImages } from '../helpers/ratingsvglinks'
require('dotenv').config()
import express, { NextFunction, Request, Response } from 'express'
import { pool } from './db'
import { transport, generateVerificationCode } from './transport'
import axios, { AxiosResponse } from 'axios'
import cors from 'cors'
import SQL, { SQLStatement } from 'sql-template-strings'
import pg, { Client, QueryResult } from 'pg'
import nodemailer from 'nodemailer'
import bcrypt from 'bcrypt'
import { sortMap, platformMap, genreMap, categoryMap } from '../helpers/enums'
import { router as deprecatedRouter } from '../routes/deprecated'

const app = express()

app.use('/api/deprecated', deprecatedRouter)


app.use(express.json())
app.use(requestLogger)
app.use(cors(corsOptions))