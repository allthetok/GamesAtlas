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

export { Language_support_types, sortMap, platformMap }