*[ Jarred 9.30am ]*

Ah, right.

The way the side-bar is at the moment we can't add day-5 unless we edit day-4.

This whole code-base could really use a tidy. It's become a bit tangled.

There are a number of tangles going on with this project.

---

#### an attempt to classify assorted wisps of dread drifting about my system

1. Rapidly prototyping software often involves cutting corners. In programming the work to un-cut corners grows non-linearly with each additional temporary hack. There comes a point in every rapidly prototyped project where the ability to add new features starts to slow down and time spent working around the consequences of quick-fixes grows.

   A surprising amount of human moral machinery gets repurposed in programming I think. When I'm not keeping a codebase "clean" there's a subtle self-disgust that starts to mount, as though I'm failing to take full care of my physical health via hygiene.

   I've noticed that AI-coding both expands the window of play before walls start to get hit, and also rams me into them sooner and harder.

   This wall might be around the corner or it might just be Friday.

2. There's a related dread when building prototypes which I think often masquerades as cutting-corners-shame-dread but is in fact something deeper that's actually more to do with the tension between an exciting vision and the reality. It's more akin to getting excited about a date, an apartment, or a holiday destination and then ignoring a sense of deflation on account of unmet hopes or unexpected difficulty.

   There's less of this genre of dread here with this project than I might have expected actually. Some reasons this might be:

   - Because I'm working on it full time I can afford to keep "returning to the bone" / regenerating the source of my inspiration. There's enough time to complete full inspiration -> experiment -> mild deflation -> orienting -> inspiration loops. Maybe more practically speaking "there's enough time spare to put my headphones on and sit in my kitchen and write in order to re-contact a feeling that these experiments are worthwhile on their own terms.

   - It's actually a cool project with many interesting directions

   - Something about "working in public" and or the research log. Normally when I'm doing research most of the interesting work is in the orienting before and after experiments. Generally this is just stored away a md file on my computer. There's something very nice about sharing it as I go and I think it takes a lot of the pressure off the results of the experiments themselves having to fully justify the time spent.

3. Sophie and I have become desynchronised in some way I don't understand and I continue to worry I'm not being a good collaborator. Or maybe more accurately there is a vague dread. Come to think of it this is also quite typical of my experience with collective research projects.

   Venting into the research log helps me to feel caught up with myself and have fluency with proceedings. Maybe I could add password protected cards and Sophie would find this helpful 🤔.

- - -

#### some thoughts on some things my friend Harri has once said to me

Harri once told me a story I think about often.

He was in change of interviewing elite impressive young people for EA grants.

Often in the course of the interview a sense of confusion would arise in Harri, and (because he's a hero) he would ask the dumb obvious question posed by his confusion.

"Wouldn't an unaligned AI just do X?"

"What if the government doesn't like that idea?"

"Isn't there a whole academic field that's been trying to answer that question for decades?"

The interviewee would answer quickly, confidently, and maybe dismissively. Harri was still confused though so he would ask the same question again or ask the obvious question brought up by their response. This back and forth would sometimes play out over a long period where Harri would just keep asking the dumb obvious question, and eventually they'd get to a point where the interviewee was like "Oh... well yeah I guess we haven't thought of that" or something.

I think about this a lot.

- - -

Last year Harri spent a great deal of time thinking about Effective Altruism. I think he was dwelling upon what it was about EA which compelled him to give his twenties to it and what about it, in retrospect, still seems worth sacrificing the prime of one's life unto (my words).

In my memory he repeated often to me with great strain something like :

H: "so there's truth"
\
J: "yes"
\
H: "the truth is quite good"
\
J: "yes"
\
H: "and also... good"
\
J: "yes"
\
H: "good is also very good"
\
J: "yes, famously"
\
H: "and the thing is when you have... people"
\
J: "yes"
\
H: "and they're together" and he might have held both his hands up to indicate two different people
\
J: "yes"
\
H: "when they care about the truth and also the good" and he sort of gestured at the space between his hands representing two different people
\
H: "and truth and good and the truth about the good and the good about the truth can exist and move between them"
\
J: "yes"
\
H: "well that's quite good"
\
J: "yes"
\
H: "and when there's a lot of that going on"
\
J: "yes"
\
H: "well then that's really good I think... it's really up there"

I think the actual sentence he repeated was "a lively epistemic forum" but the above dialogue is how it exists in my mind and also might have actually happened at least in part or at the very least in spirit.

According to me this also rhymes with what Anna reported in her experience of early EA. I think the word she used was "earnest". An unusual concentration of earnestness regarding the world and what a good world might look like.

- - -

Something else Harri would say to me often and still does: "build me lesswrong for postrats!" or "build me a post-rat forum!"

I said "that's what twitter is" and he said "I want twitter but it's only you and me on it."

"and it could run on voice notes!" I say which idk if Harri is too keen on.

We tried sharing a google doc where we would write one another little essays and that was quite fun. It's quite good and often surprisingly productive to write for an audience of friends. Sometimes at LARC we talk about "a society of letters" and everyone says "mmmm".

I've thought about that often this week. Often this month actually.

There was something really gratifying about reading Harri's Inkhaven post each day.

A lively epistemic forum.

Earnestness.

Hmmmm.

hInteresting.

- - -

*[ Jarred 12pm ]*

Ok. Let's take a look at what a password protected card might look like.

   "🤖 Hello Claude-code"

   "Please copy the vscode extension in day-3 into day-5, we're going to add to it."

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
   \[Encrypted]

   asfdhunjndfgdfsg
   ```

   and if encryption is toggled again it will look like

   ```
   \[ Unencrypted ]
   [ Jarred 10.am ]

   This is my message
   ```

   and then we add a git commit to do a quick scan for cards with [ Unencrypted ] and we refuse to push then and tell the user to either remove it or encrypt it before pushing."


   On the front-end, there should be a script that detects if a card is encrypted when it's rendering the page in the browser. If it's encrypted, don't show the encrypted text; instead, just display the user and a decrypt button. Then, ask for that user's password and add a checkbox that's like "Save this password" and "Automatically decrypt in the future" into local storage, which will just be like the username-password.

- - -
[Jarred 1pm]
[Encrypted]

KBhgeAR/HtF4DngpiE2Z5Q==:X/Hg7p7aFp11uwMtaZnnY8yFt4b8y87QRlTobFSU9SMZW5t2xQWh10OxDTKJMsipr4O72lG2Dus8xgFVBhvQkg==
