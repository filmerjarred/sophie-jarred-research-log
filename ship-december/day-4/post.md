*[ Jarred 7.30am ]*

Good morning

I'm a little bit in-the-sea.

I'm not drowning because I'm not thrashing about and the waves are not so uppity.

It would be nice to get dry and to get warm though before I start working in earnest.

- - -

*[ Jarred 10.10am ]*

Well, I just spent 2-3 hours writing into [[day-4/appendices/jarred-margin]].

I sort of have a plan for something to ship. Let's see if we can add a comment system by turning these markdown files into "cards" by splitting on "- - -". Then we can add a github action or a cloudflare function which appends a "card" to the post by appending something to post.md like:

```
 - - -
user: harri
type: comment

banger stuff
```

I guess the MVP could just support anon comments, or something that starts with "From: Harri". We probably do need to know it's a comment to style it appropriately.

We'll also need to be able to add meta data if the comment is "inline" like a gdoc comment.

- - -

Of course!

Ok so today's ideal features would be:

0. Introduce cards as a primitive
2. Add tooling to add cards to margin using the librarian
1. Make the librarian easier to access
3. Add tooling to add cards to comments.md
