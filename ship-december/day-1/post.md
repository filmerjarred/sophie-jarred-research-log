#### **some preamble**

The kingdom of heaven is that sometimes we can generate order and that we can accept and extend grace.

\---

I’d like to ship some software today. Before I begin (inadvisably) I'm trying to remember why.

Sophie and I have a harebrained scheme inspired by Inkhaven to ship a working piece of software every work day in the month of December. I’m toying with calling it Ship December but she has yet to sign off. “December” would be a formidable name for a ship I think.

As far as a shared plan goes, all we have at this time is some text messages saying “let’s do it.”

Some questions which reasonably present themselves at this juncture:

* What counts as shipped?

* What happens if we fail to ship?

* Is it okay that I (Jarred) have already written a minor essay about bones (below) in which I use a lot of “I” statements and not “We” statements?

* Is it okay that I’ve already written a provisional plan in which we ship a webpage which records a message to a google doc?

Hopefully Sophie can answer these and more when she wakes up.

Sophie: I am awake\!

* What counts as shipped?  
  Sophie: First we say some words about an idea. Then later we can click some buttons on our phones and/or laptops and then a reliably cool thing related happens on the screen.

* What happens if we fail to ship?  
  Sophie: If we miss one day, then we admit our failure to Harri and he is egregiously disappointed in us. Or we go without coats for a day. If we miss two days in a row, then the project is over.

* Is it okay that I (Jarred) have already written a minor essay about bones (below) in which I use a lot of “I” statements and not “We” statements?  
  Sophie: Obviously, this question is the whole project.

* Is it okay that I’ve already written a provisional plan in which we ship a webpage which records a message to a google doc?  
  Sophie: :O YES. Can I see?\!?

#### **some thoughts on gnawing one’s bone**

I have a bone that I would like to gnaw. It's about penetration into deep knots… it's about progress. 

My bone is about confusion, that’s true. It's about coherence. It's about "*what do you mean by that?*" and how it is like to say and hear that sentence many times in one conversation.

My bone is about deeply tangled whispers I think. Some asides and definitions on all this to follow.

\---

Something is tangled when it must move freely yet it cannot because there’s too much of itself too close together.

\---

Years ago I told John Salvatier: "*I very often feel like I've left the oven on*".

John resonated with this quite deeply. This was quite an important occasion to us both. Lately I've been referring to this feeling as "the whispers".

The most recent case of whispers I can recall I got while reading an EA x Buddhism [memoir](https://www.amazon.ca/dp/B09FFQSMLK?ref=KC_GS_GB_CA). It brought back the original ideas, mindset, and feelings I had when discovering EA. I overheard various ovens in me which have been left in an on position ever since.

\---

Annie Dillard in “The Writing Life” introduced me to this phrase: “*gnaw your own bone*.” It’s been on my mind recently. Here is the quote.

*There is something you find interesting, for a reason hard to explain.  It is hard to explain because you have never read it on any page; ...give voice to this, your own astonishment.* 

*“The most demanding part of living a lifetime as an artist is the strict discipline of forcing oneself to work steadfastly along the nerve of one’s own most intimate sensitivity.” Anne Truitt, the sculptor, said this.* 

*Thoreau said it another way: know your own bone. “Pursue, keep up with, circle round and round your life…. Know your own bone: gnaw at it, bury it, unearth it, and gnaw at it still.”*

I don’t know if I have the discipline or the finesse to work steadfastly along the nerve of my most intimate sensitivity. Gnawing at a bone is more inelegant and seems more achievable.

\---

Last Friday I spent several hours writing at my kitchen table. I got up to chop broccoli. It would be cool if I could say aloud to something "*read that back to me*" and hear what I wrote through my headphones. It would be cool if I could pause and play and rewind and make edits with my voice while I cook.

It would be cool if I could say aloud "I feel worse today, I wonder perhaps it was the beans or the large portion size” and it would go in the spreadsheet where it needs to live.

Part of what's going on with whispers is that I remember I had relevant thoughts about a subject that I've never seen written down but I don't remember what they were or in what context I had them.


\---

Ok. Here is a potential plan for today.

#### **a plan**

We could make a webpage which implements a simple design pattern. The design pattern is this:

1. I have a thought, the structure and content of which I would like to remember later  
     
2. I tap a button or icon on my phone (which is for better or worse almost always to hand)  
     
3. I speak my thought at my phone  
     
4. This is sufficient to have words reflecting my speech end up in a more durable form than my memory, say in a google doc.

#### **assorted design considerations**

1. It would be nice for everything we ship to be easy for anyone to try out, like always an ostensibly working prototype.

2. Should we implement the pattern using a website or a mobile app? Some more on this actually:   
   * If it's a website:  
     1. then it can be used the same on both apple and android phones

     2. we can trigger the recording via a shortcut icon

     3. however this means we can't trigger the recording via pressing physical buttons and it will require the phone to be unlocked

     4. There is likely to be trouble minimising the app. Like if you start recording and then close the app it’s not obvious to me the webpage will remain recording.

   *  If it's a mobile app:  
     1. the inverse of all the above points. We would need separate apps, we could trigger recording via buttons (and on android without unlocking the phone)

3. It's important to me that the recording is robustly captured and there is a start and stop signal. Even a 1% chance my capture will be lost tends to turn me off using a system completely.

4. To make it immediately usable I think I should just add my personal capped openai api key and a default google doc which they can change if they like?

5. Ideally it would work offline, even if just to capture the recording.

#### **what actually happened**

I will relate to you now the events of the day as they unfolded, and then we will have our first public immutable research log.

1. Jarred woke up early, had some caffine, and wrote most of this post

2. Sophie woke up and send Jarred the following message

![alt text](image.png)

3. We decided to ship a minimum viable version of the following system:
   a. there will exist a git-repo with a folder named "ship-dec" and sub folders from "day-1" to "day-31"
   b. if we commit a markdown file called "post.md" to /ship-december/day-1 then it will be available for viewing at "sophie-jarred.researchlog.dev/ship-december/day-1"

4. We registered the domain name, set up a cloudflare worker to do the routing, and now it works!


