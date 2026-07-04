# ...network
this repository was created for Our World of Text's [...network](https://owot.me/...network).  
the ...network chat is a shared chat between many worlds that aims to be a moderated alternative of the global chat.  
...network's canvas centre of interaction is [...world](https://owot.me/...world). it aims to be a moderated alternative of the front page.

## tags
tags mark a message as something, whether it be 'cuddletalk', 'bot' messages, or suggestive ('nsfw') - kind of like content warnings.
non-goatway bots MUST be tagged with 'bot'. sexually suggestive jokes are allowed tagged with 'nsfw' provided they're occasional.<sup>[](/rules.md#1.%20the%20chat)</sup>
* /...tag+ to start talking in a tag.
* /.t \<tags\> \<message\> to send a single message in a tag.
* /...tag- to stop talking in a tag.
* /...tag= to set your tags to specific tags.
* /...tagf to blacklist or whitelist tags.
* double-click a message to see its tags.

### for programmers
tags are used by adding a list of tags separated by <code>,</code> to the <code>tag</code> key of a message's <code>customMeta</code>.  
for example, bot developers can tag bot messages in w.chat.send like so:<pre>w.chat.send("message", {customMeta:{tag:'bot'}})</pre>
and in direct chat events like so:<pre>{
	kind: "chat",
	nickname: "maowbot",
	message: "message",
	location: "page",
	color: "#8956de",
	customMeta: {"tag":"bot"}
}</pre>  

## moderation
the [moderators](/moderators.txt) moderate according to [...rules](/rules.md). moderators:
* can limit chat users by:
  * muting (m)
  * ratelimiting (l)
  * force-tagging (t)
  * force-untagging (T)
* can limit specific users/anons
* can limit all anons
* can limit all non-moderators
* can delete messages globally by using /...delete
  * non-moderators can use this to delete messages locally
* can access the Time Machine of /...world and /...network
* are member on /...world and /...network
  * can write 20480 characters/s
  * can member-protect areas

