const ESRB = [
	{ 'IGDBRating': 6, 'src': 'https://www.esrb.org/wp-content/uploads/2021/12/RP-LM17-English.svg' },
	{ 'IGDBRating': 7, 'src': 'https://www.esrb.org/wp-content/uploads/2019/05/RP.svg' },
	{ 'IGDBRating': 8, 'src': 'https://www.esrb.org/wp-content/uploads/2019/05/E.svg' },
	{ 'IGDBRating': 9, 'src': 'https://www.esrb.org/wp-content/uploads/2019/05/E10plus.svg' },
	{ 'IGDBRating': 10, 'src':  'https://www.esrb.org/wp-content/uploads/2019/05/T.svg' },
	{ 'IGDBRating': 11, 'src': 'https://www.esrb.org/wp-content/uploads/2019/05/M.svg' },
	{ 'IGDBRating': 12, 'src': 'https://www.esrb.org/wp-content/uploads/2019/05/AO.svg' }
]

const PEGI = [
	{ 'IGDBRating': 1, 'src': 'https://pegi.info/sites/default/files/styles/medium/public/2017-03/2000px-PEGI_3.svg_.png?itok=v29cXS0R' },
	{ 'IGDBRating': 2, 'src': 'https://pegi.info/sites/default/files/styles/medium/public/2017-03/pegi7.png?itok=eI0Gk8v4' },
	{ 'IGDBRating': 3, 'src': 'https://pegi.info/sites/default/files/styles/medium/public/2017-03/PEGI_12.png?itok=YbTznZS9' },
	{ 'IGDBRating': 4, 'src': 'https://pegi.info/sites/default/files/styles/medium/public/2017-03/pegi16.png?itok=GyBvYeoU' },
	{ 'IGDBRating': 5, 'src': 'https://pegi.info/sites/default/files/styles/medium/public/2017-03/pegi18.png?itok=2iF_eHO6' },
	{ 'IGDBRating': 7, 'src': 'https://pegi.info/sites/default/files/inline-images/PEGI_Parental_Guidance_Recommended.png' }
]

const ExternalCategories = [
	{ 'source': 1, 'category': 'Steam', 'src': 'https://seeklogo.com/images/S/steam-logo-73274B19E3-seeklogo.com.png' },
	{ 'source': 5, 'category': 'GOG Galaxy', 'src': 'https://seeklogo.com/images/G/gog-galaxy-logo-DC8A483B28-seeklogo.com.png' },
	{ 'source': 10, 'category': 'Youtube', 'src': 'https://seeklogo.com/images/Y/youtube-icon-logo-521820CDD7-seeklogo.com.png' },
	{ 'source': 11, 'category': 'Microsoft Store', 'src': 'https://seeklogo.com/images/M/microsoft-store-new-2022-logo-E0E195EEF5-seeklogo.com.png' },
	{ 'source': 13, 'category': 'Apple Store', 'src': 'https://seeklogo.com/images/A/apple-ios-app-store-logo-C39E303657-seeklogo.com.png' },
	{ 'source': 14, 'category': 'Twitch', 'src': 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' },
	{ 'source': 15, 'category': 'Google Play Store', 'src': 'https://seeklogo.com/images/G/google-play-logo-C0F8C12322-seeklogo.com.png' },
	{ 'source': 20, 'category': 'Amazon', 'src': 'https://seeklogo.com/images/A/amazon-icon-logo-5D44CF81DD-seeklogo.com.png' },
	{ 'source': 22, 'category': 'Amazon', 'src': 'https://seeklogo.com/images/A/amazon-icon-logo-5D44CF81DD-seeklogo.com.png' },
	{ 'source': 23, 'category': 'Amazon', 'src': 'https://seeklogo.com/images/A/amazon-icon-logo-5D44CF81DD-seeklogo.com.png' },
	{ 'source': 26, 'category': 'Epic Games Store', 'src': 'https://seeklogo.com/images/E/epic-games-logo-A9D86272DC-seeklogo.com.png' },
	{ 'source': 28, 'category': 'Oculus', 'src': 'https://seeklogo.com/images/O/oculus-stadium-logo-E155003FA3-seeklogo.com.png' },
	{ 'source': 29, 'category': 'Utomik', 'src': 'https://seeklogo.com/images/U/utomik-logo-E7A419597C-seeklogo.com.png' },
	{ 'source': 30, 'category': 'itch io', 'src': 'https://seeklogo.com/images/I/itch-io-logo-43B308E6B7-seeklogo.com.png' },
	{ 'source': 31, 'category': 'Xbox Marketplace', 'src': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW4ESm?ver=c63e' },
	{ 'source': 32, 'category': 'Kartridge', 'src': 'https://images.squarespace-cdn.com/content/v1/61dc40395f7174360d34f79f/439dee40-fb10-40e4-90a9-4274c1b26e81/KARTRIDGE+Logo+Border+1920+x+640+White+Text.png?format=1500w' },
	{ 'source': 36, 'category': 'Playstation', 'src': 'https://seeklogo.com/images/S/sony-playstation-logo-35A4C2E414-seeklogo.com.png' },
	{ 'source': 37, 'category': 'Focus Entertainment', 'src': 'https://yt3.googleusercontent.com/7XTt7uFHyIXkl3T64x9eDsbym6jk7XazG2qaKOr7CwUzUWcXP9BsJ4cKmHb6vO-pPvBPT0nLCw=s176-c-k-c0x00ffffff-no-rj' },
	{ 'source': 54, 'category': 'Xbox Game Pass', 'src': 'https://assets.xboxservices.com/assets/c7/e1/c7e120ee-2a75-4617-a7b1-3326fa38453a.svg?n=120045_Custom-Banner-0_XGP-Logo_220x42.svg' },
	{ 'source': 55, 'category': 'Game Jolt', 'src': 'https://seeklogo.com/images/G/game-jolt-logo-BD8E35B968-seeklogo.com.png' },
]

const WebsiteCategories = [
	{ 'source': 1, 'category': 'Official', 'src': 'https://seeklogo.com/images/T/trademark-logo-A0CB9248D1-seeklogo.com.png' },
	{ 'source': 2, 'category': 'Fandom Wiki', 'src': 'https://seeklogo.com/images/F/fandom-logo-DC31E0E3EB-seeklogo.com.png' },
	{ 'source': 3, 'category': 'Wikipedia', 'src': 'https://seeklogo.com/images/W/wikipedia-logo-635576E88A-seeklogo.com.png?v=638249295940000000' },
	{ 'source': 4, 'category': 'Facebook', 'src': 'https://seeklogo.com/images/F/facebook-icon-logo-03865A9BA2-seeklogo.com.png' },
	{ 'source': 5, 'category': 'Twitter', 'src': 'https://seeklogo.com/images/T/twitter-x-logo-0339F999CF-seeklogo.com.png?v=638264860180000000' },
	{ 'source': 6, 'category': 'Twitch', 'src': 'https://seeklogo.com/images/T/twitch-logo-4931D91F85-seeklogo.com.png' },
	{ 'source': 8, 'category': 'Instagram', 'src': 'https://seeklogo.com/images/I/instagram-new-2016-logo-D9D42A0AD4-seeklogo.com.png' },
	{ 'source': 9, 'category': 'Youtube', 'src': 'https://seeklogo.com/images/Y/youtube-icon-logo-521820CDD7-seeklogo.com.png' },
	{ 'source': 10, 'category': 'Apple Store', 'src': 'https://seeklogo.com/images/A/apple-ios-app-store-logo-C39E303657-seeklogo.com.png' },
	{ 'source': 11, 'category': 'Apple Store', 'src': 'https://seeklogo.com/images/A/apple-ios-app-store-logo-C39E303657-seeklogo.com.png' },
	{ 'source': 12, 'category': 'Android', 'src': 'https://seeklogo.com/images/G/google-play-logo-C0F8C12322-seeklogo.com.png' },
	{ 'source': 13, 'category': 'Steam', 'src': 'https://seeklogo.com/images/S/steam-logo-73274B19E3-seeklogo.com.png' },
	{ 'source': 14, 'category': 'Subreddit', 'src': 'https://seeklogo.com/images/R/reddit-logo-23F13F6A6A-seeklogo.com.png' },
	{ 'source': 15, 'category': 'itch io', 'src': 'https://seeklogo.com/images/I/itch-io-logo-43B308E6B7-seeklogo.com.png' },
	{ 'source': 16, 'category': 'Epic Games', 'src': 'https://seeklogo.com/images/E/epic-games-logo-A9D86272DC-seeklogo.com.png' },
	{ 'source': 17, 'category': 'GOG Galaxy', 'src': 'https://seeklogo.com/images/G/gog-galaxy-logo-DC8A483B28-seeklogo.com.png' },
	{ 'source': 18, 'category': 'Discord Server', 'src': 'https://seeklogo.com/images/D/discord-logo-134E148657-seeklogo.com.png' },
]

const placeholderImages = {
	'NoLogo': 'https://w7.pngwing.com/pngs/937/386/png-transparent-registered-trademark-symbol-copyright-copyright-game-text-trademark-thumbnail.png',
	'LinkButtons': 'https://www.mobygames.com/static/img/icon-link-external.c0245369.svg',
	'NoArtworkScreenshotImage': 'https://t3.ftcdn.net/jpg/02/48/42/64/240_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg'
}

export { ESRB, PEGI, ExternalCategories, WebsiteCategories, placeholderImages }