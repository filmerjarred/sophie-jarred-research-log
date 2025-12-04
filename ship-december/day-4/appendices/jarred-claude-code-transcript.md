
**[11:39am]** can you do the same in day 4

**[11:52am]** /init 

**[11:56am]** please build a js file which takes an md file and turns it into "cards"
by default one markdown file is one card
if the markdown file contains \n- - -\n then we split on that and that file contains multiple cards
the first header a card contains is it's "title"
a card also has the file it's from relative to the workspace root.
please build a js file which takes an md file and outputs the cards json

**[11:58am]** can the script look for the [ User time ] pattern (time optional) and extract that into the json also

**[12:13pm]** how can we serve http js functions out of /ship-december/day-4/api? like api/comment.js

**[12:14pm]** could we add it both to the dev server and to worker.js?

**[12:24pm]** let's restructure build.js to turn post.md into "cards" using md-to-cards, and then to build the post based on the cards (which could come from any source, post.md or otherwise)

cards have markdown content, and we will need to pass each to 'marked' to build them independently, and then we lay them out on the page

**[12:27pm]** the articles are not responsive as the screen width changes. can we discuss why that might be

**[12:29pm]** nvm it's working well now. ok can we now take comments.md and add them at the end of the post and style them as comments

**[12:33pm]** ok let's start fleshing out the production version of comment.js. it should use the github api to commit the comment to comments.md for the appropriate day. i guess it will need to get the current state and then append and then push it. i also guess we'll need an api key?

**[12:36pm]** can it pull from env GIT_API_TOKEN

**[12:38pm]** is it visible? did you read .env?

**[12:46pm]** ok so in the cloudflare webpage it say i can't add a secret to a project with only static assets. but there's a worker.js...
