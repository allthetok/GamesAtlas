const Language_support_types = {
	1: 'Audio',
	2: 'Subtitles',
	3: 'Interface'
}

const sortMap = new Map<string, string>([
	['IGDB Rating', 'total_rating'],
	['Relevance', 'follows'],
	['Title', 'name'],
	['Release Date', 'first_release_date']
])

const platformMap = new Map<string, string[]>([
	// ['Xbox', ['169', '12', '49']],
	['Xbox', ['12', '49']],
	// ['Playstation', ['7', '8', '9', '48', '167', '165']],
	['Playstation', ['9', '48', '167']],
	['Linux', ['3']],
	['Nintendo', ['130', '4', '41', '18', '22', '20', '21', '33', '5']],
	['PC', ['6']]
])

const genreMap = new Map<string, number>([
	['Fighting', 4,],
	['Shooter', 5],
	['Music', 7],
	['Platform', 8],
	['Puzzle', 9],
	['Racing', 10],
	['Real Time Strategy (RTS)', 11],
	['Role-playing (RPG)', 12],
	['Simulator', 13],
	['Point-and-click', 2],
	['Sport', 14],
	['Strategy', 15],
	['Turn-based strategy (TBS)', 16],
	['Tactical', 24],
	['Quiz/Trivia', 26],
	['Hack and slash/Beat em up', 25],
	['Pinball', 30],
	['Adventure', 31],
	['Arcade', 33],
	['Visual Novel', 34],
	['Indie', 32],
	['Card & Board Game', 35],
	['MOBA', 36],
])


export { Language_support_types, sortMap, platformMap, genreMap }