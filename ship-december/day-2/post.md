⏮️ [previous](https://sophie-jarred.researchlog.dev/ship-december/day-1)&nbsp;&nbsp;&nbsp;🏡 [home](https://sophie-jarred.researchlog.dev/)&nbsp;&nbsp;&nbsp;⏭️ [next](https://sophie-jarred.researchlog.dev/ship-december/day-3)

[Jarred 9am]

Good morning!

It's Day 2 of Ship December.

I was eating breakfast just now and wondering to myself the obvious question.

"What to ship today?"

It's a great relief to have this question find me without any effort on my behalf, rather than my having to go hunting for a sense of urgency about the say. On the downside I did wake up for an hour or so at 2am last night stressed about what we might ship today. Anyway.

"What to ship today?"

I pondered this for a bit.

"I could add a side-bar with the different days to the research log?"

"I could do some fanaling such that there's a margin with all our scratch notes beside the log? And you could text a telegram channel to add to it."

None of it felt quite right, so I asked "what was that bone I wanted to gnaw this month?"

The thought then occurred to me, *it would be cool if I could say "please read aloud the segment from yesterday's research log about gnawing bones"* and an AI would repeat it to me. So we're going to do that!

If there's time I might riff a little more on why this feels relevant, but my prudence is suggesting I get shipping out of the way first, as if we fail to ship today the project is sunk and that would be very sad.

I need a song to play this section out.

🎶 Looking for Knives, DYAN 🎶

- - -

[ Jarred 10am ]

Ok!

We have an AI librarian up and running at at [/talk-to-the-log](https://sophie-jarred.researchlog.dev/ship-december/day-2/talk-to-the-log).

It lacks the polish to be useful just yet I think, but it does work.

I wonder if I can embed it here live... I'll add a screenshot and a button which should load the demo up.

<div id="embed-container">
  <div id="iframe-view" style="display: none;">
    <button onclick="showScreenshot()" style="margin-bottom: 10px; padding: 8px 16px; cursor: pointer; background: #666; color: white; border: none; border-radius: 4px;">← Back to screenshot</button>
    <br>
    <iframe id="live-embed" src="" width="100%" height="600" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
    <br>
  </div>

  <div id="screenshot-view">
    <button onclick="showEmbed()" style="margin-bottom: 10px; padding: 8px 16px; cursor: pointer; background: #4a9eff; color: white; border: none; border-radius: 4px;">Try it live ▶</button>
    <br>
    <img src="https://raw.githubusercontent.com/filmerjarred/sophie-jarred-research-log/main/ship-december/day-2/image.png" alt="screenshot of talk-to-the-log" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;">
  </div>
</div>

<script>
function showEmbed() {
  document.getElementById('screenshot-view').style.display = 'none';
  document.getElementById('iframe-view').style.display = 'block';
  // Forward API key from parent URL to iframe
  const params = new URLSearchParams(window.location.search);
  const keyParam = params.get('k');
  const iframeSrc = 'https://sophie-jarred.researchlog.dev/ship-december/day-2/talk-to-the-log' + (keyParam ? '?k=' + encodeURIComponent(keyParam) : '');
  document.getElementById('live-embed').src = iframeSrc;
}
function showScreenshot() {
  document.getElementById('iframe-view').style.display = 'none';
  document.getElementById('screenshot-view').style.display = 'block';
  document.getElementById('live-embed').src = '';
}
</script>

- - -

Am I shipped for today? Am I done?

I suppose I'd just need to email this post to our audience.

It feels a little cheap somehow... the thing that's been shipped isn't proper yet.

And it's sort of worse that it "looks like" it could be useful I think.

That's a very pernicious feeling when I'm interacting with a product that looks like it should work / should be useful but there are dumb things obviously wrong with it

It is however lunch time, and I'm starving.

okokokok, by the spirit of the rules I say we have shipped, and this afternoon we'll see about shipping something that actually feels satisfying.

- - -

[ Jarred 3pm ]

Right, we're back.

There was an issue with the voice cutting in and out and cracking. That's fixed in [/talk-to-the-log-2](https://sophie-jarred.researchlog.dev/ship-december/day-2/talk-to-the-log-2).

I might try to give it something so that I can save notes to self, and then see what it's like to chat with it while I make dinner... oh! And maybe also a tool to put words up on the screen?



⏮️ [previous](https://sophie-jarred.researchlog.dev/ship-december/day-1)&nbsp;&nbsp;&nbsp;🏡 [home](https://sophie-jarred.researchlog.dev/)&nbsp;&nbsp;&nbsp;⏭️ [next](https://sophie-jarred.researchlog.dev/ship-december/day-3)
