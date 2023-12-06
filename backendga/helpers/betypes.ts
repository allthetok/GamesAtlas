/* eslint-disable @typescript-eslint/no-explicit-any */
type SearchConfig = {
	method: string,
	url: string,
	headers: object,
	data: string
}

type MultiSearchObj = {
	sortBy: string,
	externalFilter: string,
	platformFamily: string,
	limit: number
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

type SimilarGamesObj = {
	similar_games: Explore[]
}

type GlobalAuxiliaryObj = {
	title: string,
	involved_companies: Companies[],
	summary: string,
	story: string,
	releaseDate: Date | string
}

type Explore = {
	id: number | null,
	age_ratings: any | AgeRatingsInter[] | AgeRatings
	cover: string | null,
	platforms: Platforms[],
	rating: number,
	ratingCount: number | null,
	releaseDate: Date | string,
	likes: number | null,
	title: string,
	genres: GenericStringObj[],
	involved_companies: Companies[],
}

type AgeRatings = {
	ESRB: number,
	PEGI: number
}

type Categories = {
	category: number,
	url: string
}

type Companies = {
	name: string,
	url: string,
	officialSite: string
}

type Platforms = {
	name: string,
	category: number,
	url: string,
	id: number,
	platform_family: number,
}

type Videos = {
	name: string,
	ytlink: string
}

type Languages = {
	language: string | number,
	language_support_type: string,
	marked: boolean,
	locale: string,
	native: string
}

type Covers = {
	name: string,
	cover: string | number
}

type AgeRatingsInter = {
	id: number,
	category: number,
	rating: number
}

type GenericStringObj = {
	id: number,
	name: string
}

type GameObj = {
	id: number,
	age_ratings: any | AgeRatingsInter[] | AgeRatings,
	artworks: string[],
	category: string | undefined,
	cover: string,
	external_games: Categories[],
	releaseDate: Date | string,
	likes: number,
	game_modes: string[],
	genres: GenericStringObj[],
	hypes: number,
	involved_companies: Companies[],
	keywords: string[],
	title: string,
	platforms: Platforms[],
	player_perspectives: string[],
	screenshots: string[],
	similar_games: Explore[],
	slug: string,
	story: string,
	summary: string,
	tags: string,
	themes: GenericStringObj[],
	rating: number,
	ratingCount: number,
	url: string,
	videos: Videos[],
	websites: Categories[],
	languages: Languages[],
	game_localizations: {
		name: string,
		region: string
	}[],
}

type SearchObj = {
	id: number,
	category: string | undefined,
	cover: string,
	releaseDate: Date | string,
	likes: number,
	involved_companies: Companies[],
	title: string,
	platforms: Platforms[],
	rating: number
}

interface ArtworksObj {
	artworks: string[]
}

interface ScreenshotObj {
	screenshots: string[]
}

interface VideosObj {
	videos: Videos[]
}

interface WebsitesObj {
	websites: Categories[]
}

interface Mail {
	from: string,
	to: string,
	subject: string,
	text: string
}

export { Mail, SearchConfig, MultiSearchObj, GameDetailObj, OverviewObj, ArtworkObj, LanguageObj, ScreenshotsObj, SimilarObj, VideoObj, WebsiteObj, Explore, AgeRatings, Categories, Companies, Platforms, Videos, Languages, Covers, GameObj, SimilarGamesObj, GlobalAuxiliaryObj, ArtworksObj, ScreenshotObj, VideosObj, WebsitesObj, SearchObj }