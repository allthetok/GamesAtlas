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
	['Fighting', 4],
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

const categoryMap = new Map<number, string>([
	[0, 'Main Game'],
	[1, 'DLC'],
	[2, 'Expansion'],
	[3, 'Bundle'],
	[4, 'Expansion'],
	[5, 'Mod'],
	[6, 'Episode'],
	[7, 'Season'],
	[8, 'Remake'],
	[9, 'Remaster'],
	[10, 'Expanded Game'],
	[11, 'Port'],
	[12, 'Fork'],
	[13, 'Pack'],
	[14, 'Update'],
])

const platformSpecificMap = new Map<string, number>([
	['Mac', 14],
	['PC (Microsoft Windows)', 6],
	['Linux', 3],
	['Xbox Series X|S', 169],
	['PlayStation 5', 167],
	['Xbox One', 49],
	['PlayStation 4', 48],
	['Nintendo Switch', 0],
	['PlayStation 3', 9],
	['Xbox 360', 12],
])

const themeMap = new Map<string, number>([
	['Fantasy', 17],
	['Thriller', 20],
	['Science fiction', 18],
	['Action', 1],
	['Horror', 19],
	['Survival', 21],
	['Historical', 22],
	['Stealth', 23],
	['Educational', 34],
	['Business', 28],
	['Comedy', 27],
	['Drama', 31],
	['Non-fiction', 32],
	['Sandbox', 33],
	['Kids', 35],
	['Open world', 38],
	['Warfare', 39],
	['Erotic', 42],
	['Mystery', 43],
	['Party', 40],
	['Romance', 44],
])

const gameModeMap = new Map<string, number>([
	['Battle Royale', 6],
	['Co-operative', 3],
	['Massively Multiplayer Online (MMO)', 5],
	['Multiplayer', 2],
	['Single player', 1],
	['Split screen', 4],
])

const categorySpecificMap = new Map<string, number>([
	['Main Game', 0],
	['DLC', 1],
	['Expansion', 2],
	['Bundle', 3],
	['Expansion', 4],
	['Mod', 5],
	['Episode', 6],
	['Season', 7],
	['Remake', 8],
	['Remaster', 9],
	['Expanded Game', 10],
	['Port', 11],
	['Fork', 12],
	['Pack', 13],
	['Update', 14],
])




export { Language_support_types, sortMap, platformMap, genreMap, categoryMap, platformSpecificMap, themeMap, gameModeMap, categorySpecificMap }