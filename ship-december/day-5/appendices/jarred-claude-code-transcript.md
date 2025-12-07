
**[12:18pm]** 
"Please copy the vscode extension in day-3 into day 5, we're going to add to it."

"Please add the following feature to the vscode-extension in day-5"

"Add a command which will encrypt and decrypt the contents of a card. It will take all the text (except the user) within the card where the vscode cursor currently is and encrypt it with a password that's set in the .env. If there is no password set in the .env then it will request one and set it in .env."

"It will take something like the following card:
```
[ Jarred 10.am ]

This is my message
```

and turn it into

```
[ Jarred 10.am ]
[Encrypted]

asfdhunjndfgdfsg
```

and if encryption is toggled again it will look like

```
\[ UE ]
[ Jarred 10.am ]

This is my message
```

and then we add a git commit to do a quick scan for cards with \[ UE ] and we refuse to push then and tell the user to either remove it or encrypt it before pushing."


On the front-end, there should be a script that detects if a card is encrypted when it's rendering the page in the browser. If it's encrypted, don't show the encrypted text; instead, just display the user and a decrypt button. Then, ask for that user's password and add a checkbox that's like "Save this password" and "Automatically decrypt in the future" into local storage, which will just be like the username-password.

**[12:32pm]** ok. so I'd like to make a lib folder under day-5. I'd like to identify everywhere in day-5 that we create "cards", that is, turn markdown into a collection of cards with properties like user, content, and time

**[12:35pm]** yes... although what's will be an easy way for the extension to reference it... we want to be able to edit it live, but when it's packaged a version will need to go in there and the paths will be funny

**[12:37pm]** ok... let's assume that the lib file is under day-5 and we'll have the extension "npm run watch" copy the lib into the output folder when it changes (along with doing the ts compile it's already doing). can you document this above the command in the package.json and also in the import when we import lib (and obviously it's not there in the src in the extension)

**[12:38pm]** oh also the card logic currently in the extension around encryption is wrong, it should be "seperate on - - -" and also look for [] or *[]*

**[12:43pm]** can you document all this in CLAUDE.md

**[12:48pm]** with the encrypted and UE markers please check for backslash and if it's there then don't match (don't match \[Encrypted]

**[12:51pm]** hmm, curious it still shows as encrypted on the frontend

**[12:54pm]** good, let's change all instances of \[ UE ] to \[UE]

**[12:56pm]** can you turn the recording icon into a stop icon when it's recording and then back to a recording icon again

**[12:58pm]** Can you have the voice comments be with the text comments rather than be in circles? Just be interleaved with the text comments in time order and the transcribed comment shown and with the play button to play the associated audio

**[7:15pm]** in the extension in day 5, can we add a "new card" command, which will add a new card via a "- - -" seperator (read card.js for context) and add the user's name and the time to the closest 15 minutes. maybe understand the project generally first.
