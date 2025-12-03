*[Jarred 8am]*

Good morning once again!

It's Day 3 of Ship December.

I forgot to make the time stamps on yesterdays posts italisised. This has injured me and also it's a comfort to know I can't change it.

There's really somethign to be said for containers.

Ok, where are we.

Well, just now I copied and pasted `day-2` in the `ship-december` folder and then renamed `day-2 Copy` to `day-3`. I thought it could be neat if I could right click in my editor or run a command to do this in one step. Let's ask claude-code to to whip something up.

> 🤖 can you make a folder in day-3 called "vscode-extension". can you initialise a boiler-plate vscode extension in that folder. call the
  extension ship-december. have it add a context menu command "new day" which duplicates the most recent folder in "ship-december" (say
  "day-2" and makes it "day-3").

Yay!

![alt text](image.png)

Ok, before then I was doodling in the kitchen with some tea about how I might relieve my shipping anxiety today as soon as possible.

![alt text](image-1.png)

Here's the goal:
   1. Have a sidebar which can sit to the left of the posts
   2. The sidebar will display the different days of the research log
   3. The days can be unfolded to access research material we want to append to the day but not be in the main post (transcripts with various ai for instance)

My current plan to achieve this is to use the git-tree api during our build step.

Should I explain more about our nascent architecture and what's going on with our "build step"?

It would be cool if the librarian (who has access to our code base) could be availed upon to explain to any curious reader.

It would also be cool if we had some kind of comments system so readers could be like "I'm curious about this!"

I think for now I'll just so make it happen.

Let's make a sidebar.

> 🤖 in the build step (when build.js is run) I want to add a sidebar to the index.html
>
> the sidebar should be on the left, should look nice and minimalist, all black and white (or appropraite shades thereof)
>
> the sidebar should display the posts of the days of ship december "day 1, day 2, etc".
>
> clicking an entry should go to it's url (i.e /ship-december/day-3)
>
> there should be a chevron dropdown to the right which is subtle demarkated.
>
> ok so i'm thinking subtle greay lines to demarcate the days vertically and then also a line to seperate the chevron horizontally from the day title.
>
> clicking the chevron should expand the entry in the sidebar
>
> if there are appendices for that day, then they should appear in a tree when the item is expanded.
>
> days have appendices if there is an "appendices" folder in the day (i.e /ship-december/day-3/appendices). we can discover this just using the file system.
>
> when the appendix items are clicked they should be loaded in the main-content window where the post was.
>
> perhaps there should be an "x" in the upper right?
>
> maybe it should be a modal?
>
> let's make it a black text on white with a simple black border (maybe a subtle drop shadow) pop-up modal for now which will display the appendix item.

- - -

*[ Jarred 9.30am ]*

yay!

![alt text](image-2.png)

Where does that leave us?

Going down a rabbit-hole trying to make the timestamps on my claude-code transcript accurately reflect the time apparently.

- - -

*Now* where does that leave us?

I'm meeting with Sophie in 3 hours. Do I have what I need to say we've shipped?

We have a sidebar now, and it displays whatever is in the `appendicies` folder in the repo.

My spell-checker has just informed me that `appendicies` is spelt `appendices`. Hold on.

![alt text](image-3.png)

- - -


We have a sidebar now, and it displays whatever is in the `appendices` folder in the repo.

Can we call that done? Can we send it to all our friends and have it work on their phones?

How does it look on mobile? Good question.

![alt text](image-4.png)

😬 oh lord, not good at all. The sidebar is half the screen.

> 🤖 if the screen is less than 800px wide can you bring the sidebar width to 125px and adjust the main content
  and left margin appropraitely

This is not an ideal level of detail and polish to be getting into when vibe-coding. 
In my mind all this will have to be re-done anyway... or rather maybe better to say:

1. if we're not going to throw this code away then
2. it will have to be totally re-done with a human properly in the loop

> 🤖 can you add this feature to day-3 index.html "you can swipe right anywhere on the sidebar to have it take up
  the majority of the screen, when tapping the main content it returns to normal"

Many have noticed at this point that vibe-coding can be quite addictive. There's always little adjustments that can be made which pop to mind, and the friction to acting it has become quite minimal.

> 🤖 swiping left on the sidebar should also revert it to the original width

Ok

> 🤖 please make the page not horizontally scrollable

Okokok. Let's ship to production and ensure it works on my actual mobile at the live address rather than just on my PC.

> 🤖 you also need to add overflow-x: hidden to the html tag not just the body



⏭️ [next](/ship-december/day-4)
