const n_networkIndicator = "hiiii hello :333";

var n_socket = new ReconnectingWebSocket('wss://ourworldoftext.com/...network/ws/');
elm.chat_page_tab.style.minWidth = '80px';
if (state.worldModel.no_chat_global) {
	elm.chat_upper.style.textAlign = '';
	elm.chat_page_tab.style.display = '';
	elm.usr_online.style.paddingLeft = '';
}
var n_chatTab = document.createElement('div');
n_chatTab.innerText = '...network';
n_chatTab.classList.add('chat_tab_button');
n_chatTab.style.minWidth = '80px';
n_chatTab.id = 'chat_network_tab';
elm.chat_network_tab = n_chatTab;
elm.chat_global_tab.after(n_chatTab);
var n_chatfield = document.createElement('div');
n_chatfield.classList.add('chatfield');
n_chatfield.style.display = 'none';
n_chatfield.id = 'network_chatfield';
elm.network_chatfield = n_chatfield;
elm.global_chatfield.after(n_chatfield);
var n_unreadText = document.createElement('b');
n_unreadText.classList.add('unread');
n_unreadText.id = 'network_unread';
elm.network_unread = n_unreadText;
n_chatTab.append(n_unreadText);
var chatNetworkUnread = 0;
var chatAdditionsNetwork = [];
var chatRecordsNetwork = [];
var initNetworkTabOpen = false;
var n_chatId;
n_chatTab.addEventListener("click", function() {
	n_chatTab.classList.add("chat_tab_selected");
	elm.chat_page_tab.classList.remove("chat_tab_selected");
	elm.chat_global_tab.classList.remove("chat_tab_selected");

	elm.page_chatfield.style.display = "none";
	elm.global_chatfield.style.display = "none";
	n_chatfield.style.display = "";
	selectedChatTab = 2;
	chatNetworkUnread = 0;

	// from insertNewChatElementsIntoChatfield
	for(let message of chatAdditionsNetwork) {
		buildChatElement(n_chatfield,
			message.id, message.type, message.nickname, message.message,
			message.realUsername, message.op, message.admin, message.staff,
			message.color, message.date, message.dataObj);
		message.element = n_chatfield.lastElementChild;
		chatRecordsNetwork.push(message);
	}
	chatAdditionsNetwork.splice(0);

	updateUnread();
	if(!initNetworkTabOpen) {
		initNetworkTabOpen = true;
		n_chatfield.scrollTop = n_chatfield.scrollHeight;
	}
});
n_chatfield.addEventListener('wheel', function(e){
	e.stopPropagation();
});
elm.chat_page_tab.addEventListener('click', function(){
	n_chatTab.classList.remove('chat_tab_selected');
	n_chatfield.style.display = 'none';
});
elm.chat_global_tab.addEventListener('click', function(){
	n_chatTab.classList.remove('chat_tab_selected');
	n_chatfield.style.display = 'none';
});
n_socket.onopen = function(){
	n_socket.send(`{"kind":"chathistory"}`);
}
function n_addChat(id, type, nickname, message, realUsername, op, admin, staff, color, date, dataObj) {
	if(!dataObj) dataObj = {};
	if(!message) message = "";
	if(!realUsername) realUsername = "";
	if(!nickname) nickname = realUsername;
	if(!color) color = assignColor(nickname);
	var msgData = {
		id, type, nickname, message, realUsername, op, admin, staff, color, date, dataObj
	};
	chatAdditionsNetwork.push(msgData);
	if(chatAdditionsNetwork.length > chatHistoryLimit) {
		chatAdditionsNetwork.shift();
	}
	// from insertNewChatElementsIntoChatfield
	for(let message of chatAdditionsNetwork) {
		buildChatElement(n_chatfield,
			message.id, message.type, message.nickname, message.message,
			message.realUsername, message.op, message.admin, message.staff,
			message.color, message.date, message.dataObj);
		message.element = n_chatfield.lastElementChild;
		chatRecordsNetwork.push(message);
	}
	chatAdditionsNetwork.splice(0);
	return msgData.element;
}
function clientChatResponse(message) {
	if (selectedChatTab == 2) { return n_addChat(0, "user", "[ Client ]", message, "Client", false, false, false, null, getDate()) }
	addChat(null, 0, "user", "[ Client ]", message, "Client", false, false, false, null, getDate());
}
function getChatfield() {
	if(selectedChatTab == 0) {
		return elm.page_chatfield;
	} else if(selectedChatTab == 1) {
		return elm.global_chatfield;
	} else if(selectedChatTab == 2) {
		return elm.network_chatfield;
	}
}
function n_onhistory(data) {
	w.emit("chathistory", data)
	var page_prev = data.page_chat_prev;
	var lastChatted = {};
	for(var p = 0; p < page_prev.length; p++) {
		var chat = page_prev[p];
		n_onChat(chat, lastChatted);
		if (chat.hide) continue;
		var type = chatType(chat.registered, chat.nickname, chat.realUsername);
		n_addChat(chat.id, type, chat.nickname, chat.message, chat.realUsername,
				  chat.op, chat.admin, chat.staff, chat.color, chat.date, chat.dataObj);
	}
}
n_socket.onmessage = function(msg){
	let data = JSON.parse(msg.data);
	if (data.kind == 'chathistory') {
		n_onhistory(data)
	} else if (data.kind == 'chat') {
		if (data.location != 'page') return;
		if (!(chatOpen && selectedChatTab == 2)) {
			++chatNetworkUnread;
			updateUnread();
		}
		data.type = chatType(data.registered, data.nickname, data.realUsername);
		n_onChat(data);
		if (data.hide) return;
		n_addChat(data.id, data.type, data.nickname, data.message, data.realUsername,
				  data.op, data.admin, data.staff, data.color, data.date || Date.now(), data.dataObj);
	} else if (data.kind == 'channel') {
		n_chatId = data.id;
	}
}
sendChat = function() {
	var chatText = elm.chatbar.value;
	elm.chatbar.value = "";
	var opts = {};
	if (selectedChatTab == 2) opts.location = 'network';
	if(defaultChatColor != null) {
		opts.color = "#" + ("00000" + defaultChatColor.toString(16)).slice(-6);
	}
	api_chat_send(chatText, opts);
}
w.on('chatsend', function(e){
	if (selectedChatTab != 2) return;
	let global = nm_getGlobalLimits();
	let userl = nm_getLimitedUsers(!state.userModel.username);
	let user = state.userModel.username ? state.userModel.username : n_chatId;
	let date = Date.now();
	let affects = {};
	if (userl[user]) {
		for (let type of Object.keys(userl[user])) {
			affects[type] = userl[user][type];
		}
	}
	if (!state.userModel.username && userl[0]) {
		for (let type of Object.keys(userl[0])) {
			if (affects[type]) {
				if (type == 'l') affects[type] = Math.max(affects[type], userl[0][type]);
			} else { affects[type] = userl[0][type] }
		}
	}
	if (!nm_mods.includes(state.userModel.username)) {
		for (let type of Object.keys(global)) {
			if (affects[type]) {
				if (type == 'l') affects[type] = Math.max(affects[type], global[type]);
			} else { affects[type] = global[type] }
		}
	}
	if (affects.m) {
		e.cancel = true;
		if (affects.m < 0xfffffffffff) {
			let expireDate = new Date(affects.m);
			let expireString = expireDate.toISOString();
			let msToExpire = affects.m - Date.now();
			let relativeExpire = msToExpire / 1000;
			return clientChatResponse(`You're muted until ${expireString} (for ${relativeExpire}s).`)
		} else {
			return clientChatResponse(`You're muted.`)
		}
	}
	if (affects.l && nm_lastSentMessage) {
		let offset = nm_lastSentMessage - date + affects.l*1000;
		if (offset > 0) {
			e.cancel = true;
			return clientChatResponse(`Chat again in ${offset/1000} seconds.`);
		}
	}
	nm_lastSentMessage = date;
});
network.chat = function(message, location, nickname, color, customMeta) {
	let data = {
		kind: "chat",
		nickname,
		message,
		location,
		color,
		customMeta
	};
	if (location == 'network') n_socket.send(JSON.stringify(data));
	else network.transmit(data);
}
function updateUnread() {
	var total = elm.total_unread;
	var page = elm.page_unread;
	var global = elm.global_unread;
	var network = elm.network_unread;
	var totalCount = chatPageUnread + chatGlobalUnread + chatNetworkUnread;
	total.style.display = "none";
	network.style.display = "none";
	global.style.display = "none";
	page.style.display = "none";
	if(totalCount) {
		total.style.display = "";
		total.innerText = totalCount > 99 ? "99+" : "(" + totalCount + ")";
	}
	if(chatOpen) { // don't want to stretch tab width before it's initially calculated
		if(chatPageUnread) {
			page.style.display = "";
			page.innerText = chatPageUnread > 99 ? "99+" : "(" + chatPageUnread + ")";
		}
		if(chatGlobalUnread) {
			global.style.display = "";
			global.innerText = chatGlobalUnread > 99 ? "99+" : "(" + chatGlobalUnread + ")";
		}
		if(chatNetworkUnread) {
			network.style.display = "";
			network.innerText = chatNetworkUnread > 99 ? "99+" : "(" + chatNetworkUnread + ")";
		}
	}
}
var nm_lastMessageDates = [];
function n_onChat(e, untimed) {
	e.network = true;
	w.emit('chatmod', e);
	if (e.hide) return;
	let date = untimed ? e.date : Date.now();
	if (nm_deletedMessages.includes(date)) return e.hide = true;
	let userl = nm_getLimitedUsers(!e.realUsername);
	let global = nm_getGlobalLimits();
	let user = e.realUsername || e.id;
	let lastChatted = untimed || nm_userLastChatted;
	let affects = {};
	if (userl[user]) {
		for (let type of Object.keys(userl[user])) {
			affects[type] = userl[user][type];
		}
	}
	if (!e.realUsername && userl[0]) {
		for (let type of Object.keys(userl[0])) {
			if (affects[type]) {
				if (type == 'l') affects[type] = Math.max(affects[type], userl[0][type]);
			} else { affects[type] = userl[0][type] }
		}
	}
	if (!nm_mods.includes(e.realUsername)) {
		for (let type of Object.keys(global)) {
			if (affects[type]) {
				if (type == 'l') affects[type] = Math.max(affects[type], global[type]);
			} else { affects[type] = global[type] }
		}
	}
	if (affects.m) { return e.hide = true }
	if (affects.l && lastChatted[user]) {
		let offset = date - lastChatted[user] - affects.l*1000;
		if (offset < 0) {
			return e.hide = true;
		}
	}
	lastChatted[user] = date;
	nm_lastMessageDates.unshift(date);
	if (nm_mods.includes(e.realUsername)) {
		e.dataObj ??= {};
		e.dataObj.rankName = 'mod';
		e.dataObj.rankColor = '#7befef';
	}
}
clientChatResponse(`>> the intended centre of interaction for ...network is /...world <<
please go there to interact with others, since /...network is simply a portal hub for exploration and ideally should not be cluttered`);

// MODERATION

var nm_mods = [];
async function nm_fetchMods() {
	nm_mods = await fetch("https://api.github.com/repos/LimeSlime888/...network/contents/moderators.txt?raw=true").then(e=>e.json());
	nm_mods = atob(nm_mods.content).split('\n').filter(e=>e);
	if (nm_mods.includes(state.userModel.username)) {
		nm_registerCommands();
		clientChatResponse(`>> welcome ${state.userModel.username}! <<
you're a moderator for ...network. use /...help or go to /...network/limits for moderation help!`);
	}
}
nm_fetchMods();
var nm_socket = new ReconnectingWebSocket('wss://ourworldoftext.com/...network/limits/ws/?hide=1');
nm_socket.onmessage = function(msg) {
	var data = JSON.parse(msg.data);
	var kind = data.kind;
	if (nm_events[kind]) {
		nm_events[kind](data);
	}
}
nm_socket.onopen = function() {
	nm_network.fetch({minX: 0, minY: 0, maxX: 128, maxY: 0});
	nm_network.fetch({minX: 0, minY: -1, maxX: 2, maxY: -1});
}
var nm_network = {
	transmit: function(data) {
		data = JSON.stringify(data);
		try {
			nm_socket.send(data);
		} catch (e) {
			console.warn("Transmission error");
		}
	},
	write: function(edits, opts, callback) {
		if (!opts) opts = {};
		var writeReq = {
			kind: "write",
			edits: edits,
			public_only: opts.public_only,
			preserve_links: opts.preserve_links
		};
		nm_network.transmit(writeReq);
	},
	fetch: function(fetches){
		// fetches: [{minX, minY, maxX, maxY}]		
		if(typeof fetches == "object" && !Array.isArray(fetches)) fetches = [fetches];
		var fetchReq = {
			fetchRectangles: fetches,
			kind: "fetch"
		};
		nm_network.transmit(fetchReq);
	},
	clear_tile: function(position) {
		// position: {tileX, tileY, [charX, charY, [width, height]]]}
		var data = {
			tileX: position.tileX,
			tileY: position.tileY
		};
		var isPrecise = "charX" in position || "charY" in position || "charWidth" in position || "charHeight" in position;
		if(isPrecise) {
			data.charX = position.charX;
			data.charY = position.charY;
			if(!("tileX" in position || "tileY" in position)) {
				data.tileX = Math.floor(data.charX / tileC);
				data.tileY = Math.floor(data.charY / tileR);
				data.charX = data.charX - Math.floor(data.charX / tileC) * tileC;
				data.charY = data.charY - Math.floor(data.charY / tileR) * tileR;
			}
			if("charWidth" in position && "charHeight" in position) {
				data.charWidth = position.charWidth;
				data.charHeight = position.charHeight;
			}
		}
		var req = {
			kind: "clear_tile",
			data: data
		};
		nm_network.transmit(req);
	}
};
var nm_events = {
	tileUpdate: function(e) {
		return nm_onTileUpdate(e)
	},
	fetch: function(e) {
		for (let tile of Object.entries(e.tiles)) {
			let obj = {tiles: {}};
			obj.tiles[tile[0]] = tile[1];
			nm_onTileUpdate(obj);
		}
	}
}
function nm_parseLargeInt(fg=0, bg=0) {
	if (bg < 0) bg = 0;
	return bg * 16777216 + fg
}
function nm_makeLargeInt(n=0) {
	return [Math.floor(n % 16777216), n < 16777216 ? -1 : Math.floor(n / 16777216)]
}
function nm_cleanLimit(n=0) {
	let date = getDate();
	let x = Math.max(n, 0);
	let y = Math.max(-n - 1, 0);
	let writes = [];
	if (n < 0) {
		for (let i = 0; i < 15; i++) {
			writes.push([-1, 0, y, i, date, ' ', nextObjId++]);
		}
	} else {
		for (let i = 0; i < 127; i++) {
			writes.push([0, x, Math.floor(i / 16), i % 16, date, ' ', nextObjId++]);
		}
	}
	return writes;
}
function nm_clearGlobalLimit(y=0) {
	nm_network.clear_tile({
		tileX: 0,
		tileY: -1,
		charX: 0,
		charY: y,
		charWidth: 16,
		charHeight: 1
	});
}
function nm_updateLimit(x=0, user, type='m', expire=0, newId=false, clean=true, ...info) {
	// user < 0: global ratelimit
	// user => 0: anon id
	// expire = Date, Number
	if (typeof user == 'string') {} else if (typeof user == 'number') {
		user = Math.round(user)
	} else if (user !== null) {
		return console.warn('Invalid user parameter:', user);
	}
	if (expire !== null) {
		if (expire instanceof Date) {
			expire = expire.getTime()
		}
		expire = Math.min(expire, 0xffffffffffff);
		if (isNaN(expire))
			throw new TypeError('Invalid expiry');
	}
	let date = getDate();
	let infoY;
	let y;
	if (typeof user == 'number' && user < 0) {
		infoY = -user - 1;
		y = -1
	} else {
		infoY = 7;
		y = 0
	}
	let write_id;
	if (newId) {
		newId = Math.floor(Math.random() * 281474976710656);
		write_id = [y, x, infoY, 15, date, '•', nextObjId++, ...nm_makeLargeInt(newId)];
	}
	let write_type = type && [y, x, infoY, 0, date, type, nextObjId++, 0xaaaaaa, 0x444444];
	let write_expire = expire && [y, x, infoY, 1, date, '•', nextObjId++, ...nm_makeLargeInt(expire)];
	let write_info = [];
	if (!isNaN(+info[0])) {
		if (type == 'l') info[0] = +info[0] * 256;
	}
	for (let param of Object.entries(info)) {
		let index = +param[0];
		if (index > 11 || isNaN(param[1] = +param[1]))
			continue;
		write_info.push([y, x, infoY, 2 + index, date, '•', nextObjId++, ...nm_makeLargeInt(param[1])])
	}
	let write_user = [];
	if (typeof user == 'string') {
		let i = 0;
		for (let char of advancedSplit(user)) {
			write_user.push([y, x, Math.floor(i / 16), i % 16, date, char, nextObjId++]);
			i += 1;
		}
	} else if (user < 0) {} else {
		write_user.push([y, x, 0, 0, date, '•', nextObjId++, 0xffffff, user])
	}
	let cleanN;
	if (typeof user == 'number' && user < 0)
		cleanN = user - 1;
	else
		cleanN = x;
	let writes = [...write_info, ...write_user];
	if (clean)
		writes.unshift(...nm_cleanLimit(cleanN));
	if (write_type)
		writes.push(write_type);
	if (write_expire)
		writes.push(write_expire);
	if (write_id)
		writes.push(write_id);
	nm_network.write(writes);
	flushWrites();
}
function nm_readLimit(tile, row=-1) {
	// row 0~7
	if (tile === undefined || tile === null) return;
	if (!(tile instanceof Object))
		return console.warn(`Attempted to read non-tile limit (not Object)`);
	if (!tile.content)
		return console.warn(`Attempted to read non-tile limit (no .content)`);
	if (!tile.properties)
		return console.warn(`Attempted to read non-tile limit (no .properties)`);
	if (!tile.properties.color) return;
	if (!tile.properties.bgcolor) return;
	let type = tile.content[row < 0 ? 112 : row * 16];
	if (type == ' ') return;
	let expire = nm_parseLargeInt(tile.properties.color[row < 0 ? 113 : row * 16 + 1], tile.properties.bgcolor[row < 0 ? 113 : row * 16 + 1]);
	let id = nm_parseLargeInt(tile.properties.color[127], tile.properties.bgcolor[127]);
	let info = [];
	for (let i = 2; i < 15; i++) {
		let j = i;
		if (row >= 0)
			j += row * 16;
		else
			j += 112;
		info.push(nm_parseLargeInt(tile.properties.color[j], tile.properties.bgcolor[j]));
	}
	if (type == 'l') info[0] /= 256;
	let user;
	if (row < 0) {
		if (tile.properties.bgcolor[0] >= 0) {
			user = tile.properties.bgcolor[0];
		} else {
			user = '';
			for (let i = 0; i < 112; i++) {
				let char = tile.content[i];
				if (char == ' ')
					break;
				user += char;
			}
		}
	} else {
		user = -row - 1;
	}
	return {type, expire, info, user, id};
}
var nm_userLimits = [];
var nm_globalLimits = [, , , , , , , , ];
var nm_deletedMessages = Array(256);
var nm_userLastChatted = {};
var nm_lastSentMessage = 0;
function nm_onTileUpdate(e) {
	let pos = Object.keys(e.tiles)[0];
	if (pos == '-1,1' || pos == '-1,2') {
		let tile = e.tiles[pos];
		let start = (pos == '-1,2') * 128;
		if (!tile.properties.color || !tile.properties.bgcolor) {
			for (let char = start; char < start+128; char++) {
				delete nm_deletedMessages[char]
			}
			return true
		} else {
			for (let char = 0; char < 128; char++) {
				if (tile.content[char] == ' ') delete nm_deletedMessages[start+char];
				let date = nm_parseLargeInt(tile.properties.color[char], tile.properties.bgcolor[char]);
				nm_deletedMessages[start+char] = date;
				if (e.channel != w.socketChannel) nm_deleteMessageDate(date);
			}
			return true
		}
	}
	let limit;
	let n;
	if (pos == '-1,0') {
		limit = [];
		for (let row = 0; row <= 7; row++) {
			limit.push(nm_readLimit(e.tiles[pos], row));
		}
		n = -1;
	} else if (pos.slice(0,pos.indexOf(',')) == '0') {
		limit = nm_readLimit(e.tiles[pos]);
		n = +pos.slice(2)
	} else { return false }
	if (n < 0) {
		for (let i = 0; i <= 7; i++) {
			if (!limit || !limit[i]) {
				delete nm_globalLimits[i];
				continue;
			}
			if (nm_globalLimits[i] && nm_globalLimits[i].id == limit[i].id) {
				if (limit[i]) {
					for (let prop of ['type', 'expire', 'info', 'id']) {
						nm_globalLimits[i][prop] = limit[i][prop];
					}
				} else {
					delete nm_globalLimits[i];
				}
			} else if (limit[i]) {
				nm_globalLimits[i] = limit[i];
			}
		}
	} else {
		if (!limit)
			delete nm_userLimits[n];
		if (nm_userLimits[n] && nm_userLimits[n].id == limit.id) {
			if (limit) {
				for (let prop of ['type', 'expire', 'info', 'user', 'id']) {
					nm_userLimits[n][prop] = limit[prop];
				}
			} else {
				delete nm_userLimits[n];
			}
		} else if (limit) {
			nm_userLimits[n] = limit;
		}
	}
	return true
}
function nm_leastUnexpiredX() {
	let d = Date.now();
	for (let x = 0; x < nm_userLimits.length; x++) {
		if (!nm_userLimits[x])
			return x;
		if (nm_userLimits[x].expire <= d)
			return x;
	}
	return nm_userLimits.length;
}
function nm_leastUnexpiredGlobal() {
	let d = Date.now();
	for (let x = 0; x <= 7; x++) {
		if (!nm_globalLimits[x])
			return x;
		if (nm_globalLimits[x].expire <= d)
			return x;
	}
	return false;
}
function nm_addUserLimit(user, type='m', expire=Date.now() + 600e3, ...info) {
	let least = nm_leastUnexpiredX();
	nm_updateLimit(least, user, type, expire, true, true, ...info);
	return least;
}
function nm_addGlobalLimit(type='m', expire=Date.now() + 600e3, ...info) {
	let least = nm_leastUnexpiredGlobal();
	if (least === false) return clientChatResponse('Out of global limit space!');
	nm_updateLimit(0, -least-1, type, expire, true, true, ...info);
	return least;
}
function nm_getLimitedUsers(anon=false) {
	let users = {};
	for (let limit of nm_userLimits) {
		if (!limit) continue;
		if (Date.now() >= limit.expire) continue;
		if (typeof limit.user != (anon ? 'number' : 'string')) continue;
		let user = limit.user;
		if (!anon) user = user.toLowerCase();
		if (!users[user]) {
			users[user] = {};
		}
		user = users[user];
		if (limit.type == 'l') {
			if (user.l) {
				user.l = Math.max(limit.info[0], user.l);
			} else {
				user.l = limit.info[0];
			}
		} else if (limit.type == 'm') {
			if (user.m) {
				user.m = Math.max(limit.expire, user.m);
			} else {
				user.m = limit.expire;
			}
		} else if (limit.info.length) {
			user[limit.type] = limit.info;
		} else {
			user[limit.type] = true;
		}
	}
	return users;
}
function nm_getGlobalLimits() {
	let limits = {};
	for (let limit of nm_globalLimits) {
		if (!limit) continue;
		if (Date.now() >= limit.expire) continue;
		if (limit.type == 'l') {
			if (limits.l) {
				limits.l = Math.max(limit.info[0], limits.l);
			} else {
				limits.l = limit.info[0];
			}
		} else if (limit.type == 'm') {
			if (limits.m) {
				limits.m = Math.max(limit.expire, limits.m);
			} else {
				limits.m = limit.expire;
			}
		} else if (limit.info && limit.info.length) {
			limits[limit.type] = limit.info;
		} else {
			limits[limit.type] = true;
		}
	}
	return limits;
}
function nm_sendDeleteMessageDate(date) {
	let least = 0;
	for (let i = 0; i < 256; i++) {
		if (nm_deletedMessages[i]) continue;
		least = i; break
	}
	let now = Date.now();
	let write_date = [-1, (least < 128) ? 1 : 2, Math.floor((least%128)/16), least%16, now, '•', nextObjId++, ...nm_makeLargeInt(date)];
	let write_delete = [-1, (least+1 < 128 || least+1 >= 256) ? 1 : 2, Math.floor(((least+1)%128)/16), (least+1)%16, now, ' '];
	nm_network.write([write_date, write_delete]);
	return nm_deleteMessageDate(date);
}
function nm_deleteMessageDate(date) {
	for (let i = 0; i < chatRecordsNetwork.length; i++) {
		let message = chatRecordsNetwork[i];
		if (message.date == date) {
			message.element.remove();
			chatRecordsNetwork.splice(i, 1);
			return message;
		}
	}
}
var n_deleteStreak = 0;
n_chatfield.addEventListener("click", function(e){if(e.ctrlKey){
	let element = e.target;
	for (let i = 0; true; i++) {
		if (element.tagName == 'DIV' && element.parentElement == n_chatfield) break;
		if (i > 12) return;
		if (!element) return;
		if (element == n_chatfield) return;
		element = element.parentElement;
	}
	for (let message of chatRecordsNetwork) {
		if (message.element == element) {
			let closed = w.ui.announcements.nm_delete.bar.style.display;
			if (closed) n_deleteStreak = 1;
			else n_deleteStreak += 1;
			w.doAnnounce(`Deleted ${n_deleteStreak} messages.`, 'nm_delete');
			return nm_sendDeleteMessageDate(message.date);
		}
	}
	return clientChatResponse('No messages found.', 'nm_delete');
}});
function nm_help() {
	clientChatResponse(`=== ...network help ===
hi, thanks for volunteering to moderate ...network's shared chat!
to limit users, you can use commands with names starting with ...
view these commands in /help!
view examples of how to use these commands in /...network/limits!
== limiting help ==
in updating commands, pass * to avoid updating the corresponding property.
<user> is the username of the person to limit.
<type> is "m"=mute or "l"=ratelimit.
<expire> is seconds to expiry. <0 = forever.
<info> is additional info:
- ratelimit: info #1 is minimum seconds per message.`)
}
function nm_registerCommands() {
	register_chat_command('...help', ()=>nm_help(), null, 'help for ...network chat moderation');

	register_chat_command('...limit', function(args) {
		let duration = +args[2];
		if (isNaN(duration))
			return clientChatResponse('Invalid duration.');
		if (duration <= 0) {
			duration = args[2] = Infinity
		} else {
			args[2] = Date.now() + duration * 1000
		}
		let x = nm_addUserLimit(...args);
		if (args[2] == Infinity) clientChatResponse(`Limited ${args[0]} forever`)
		else clientChatResponse(`Limited ${args[0]} until ${new Date(args[2]).toISOString()}`);
	}, ['user', 'type', 'expire', '...info'], 'apply a limit to a user');

	register_chat_command('...limitid', function(args) {
		args[0] = +args[0];
		if (isNaN(args[0]))
			return clientChatResponse('Invalid ID.');
		let duration = Math.min(1e7, args[2]);
		if (isNaN(duration))
			return clientChatResponse('Invalid duration.');
		if (duration <= 0) {
			duration = args[2] = Infinity
		} else {
			args[2] = Date.now() + duration * 1000
		}
		let x = nm_addUserLimit(...args);
		if (args[0] == 0) {
			if (args[2] == Infinity) clientChatResponse(`Limited all anons forever`)
			else clientChatResponse(`Limited all anons until ${new Date(args[2]).toISOString()}`);
		} else {
			if (args[2] == Infinity) clientChatResponse(`Limited ID ${args[0]} forever`)
			else clientChatResponse(`Limited ID ${args[0]} until ${new Date(args[2]).toISOString()}`);
		}
	}, ['id', 'type', 'expire', '...info'], 'apply a limit to an anon id (0 = all)');

	register_chat_command('...limitall', function(args) {
		let duration = +args[1];
		if (isNaN(duration))
			return clientChatResponse('Invalid duration.');
		if (duration <= 0) {
			duration = args[1] = Infinity
		} else {
			args[1] = Date.now() + duration * 1000
		}
		let x = nm_addGlobalLimit(...args);
		if (args[1] == Infinity) clientChatResponse(`Limited all with type ${args[0]} forever`)
		else clientChatResponse(`Limited all with type ${args[0]} until ${new Date(args[1]).toISOString()}`);
	}, ['type', 'expire', '...info'], 'apply a limit globally (mods are not affected)');

	register_chat_command('...update', function(args) {
		let limit = nm_userLimits[args[0]];
		if (!limit) return clientChatResponse(`User limit x=${+args[0]} does not exist.`);
		let duration = +args[3];
		if (isNaN(duration)) {
			duration = null
		} else if (duration <= 0) {
			duration = args[3] = Infinity
		} else {
			args[3] = Date.now() + duration * 1000
		}
		for (let i in args) {
			i = +i;
			if (args[i] == '*') {
				if (i == 2) args[2] = limit.type;
				else args[i] = null;
			}
		}
		args.splice(4, 0, false, false);
		let x = nm_updateLimit(...args);
	}, ['x', 'user', 'type', 'expire', '...info'], 'update a user limit');

	register_chat_command('...updateid', function(args) {
		let limit = nm_userLimits[args[0]];
		if (!limit) return clientChatResponse(`User limit x=${+args[0]} does not exist.`);
		let duration = +args[3];
		if (isNaN(duration)) {
			duration = null
		} else if (duration <= 0) {
			duration = args[3] = Infinity
		} else {
			args[3] = Date.now() + duration * 1000
		}
		for (let i in args) {
			i = +i;
			if (args[i] == '*') {
				if (i == 2) args[2] = limit.type;
				else args[i] = null;
			}
		}
		args.splice(4, 0, false, false);
		let x = nm_updateLimit(...args);
	}, ['x', 'id', 'type', 'expire', '...info'], 'update a user limit (to an anon id if required)');
	
	register_chat_command('...updateglobal', function(args) {
		let limit = nm_globalLimits[args[0]];
		if (!limit) return clientChatResponse(`User limit y=${+args[0]} does not exist.`);
		let duration = +args[2];
		if (isNaN(duration)) {
			duration = null
		} else if (duration <= 0) {
			duration = args[2] = Infinity
		} else {
			args[2] = Date.now() + duration * 1000
		}
		for (let i in args) {
			i = +i;
			if (args[i] == '*') {
				if (i == 1) args[1] = limit.type;
				else args[i] = null;
			}
		}
		args[0] = -(+args[0])-1;
		args.splice(0, 0, 0);
		args.splice(4, 0, false, false);
		let x = nm_updateLimit(...args);
	}, ['y', 'type', 'expire', '...info'], 'update a global limit');

	register_chat_command('...clear', function(args){
		nm_network.clear_tile({tileX: +args[0], tileY: 0});
		clientChatResponse(`Cleared global limit x=${+args[0]}.`)
	}, ['x'], 'clear a user limit');

	register_chat_command('...clearglobal', function(args){
		nm_clearGlobalLimit(+args[0]);
		clientChatResponse(`Cleared global limit y=${+args[0]}.`)
	}, ['y'], 'clear a global limit');

	register_chat_command('...delete', function(args){
		let i = +args[0];
		if (isNaN(i)) return clientChatResponse('Invalid index.');
		let date = nm_lastMessageDates[i];
		if (date == undefined) return false;
		nm_sendDeleteMessageDate(date);
	}, ['index'], `delete a message (0 = last message, 1 = second last message etc.)
you can also do this by clicking a message while holding Ctrl`);
}

register_chat_command('...list', function(args) {
	let limitCount = 0;
	let toChats = [];
	for (let limit of Object.entries(nm_userLimits)) {
		if (Date.now() >= limit[1].expire) continue;
		limitCount += 1;
		let toChat;
		let userString;
		if (typeof limit[1].user == 'string') {
			userString = limit[1].user;
		} else {
			if (limit[1].user == 0) { userString = 'all anons' }
			else { userString = '* ' + limit[1].user }
		}
		toChat = `• x = ${limit[0]}; ${userString}; type ${limit[1].type}`
		if (limit[1].expire >= 0xfffffffffff) {
			toChat += `; expires never`;
		} else {
			let expireDate = new Date(limit[1].expire);
			let expireString = expireDate.toISOString();
			let msToExpire = limit[1].expire - Date.now();
			let relativeExpire = msToExpire / 1000;
			toChat += `; expires ${expireString} (${relativeExpire}s)`;
		}
		let info = [...limit[1].info];
		let lastNonZero = info.findLastIndex(e => e != 0);
		if (lastNonZero >= 0) {
			info.splice(lastNonZero + 1)
		} else {
			info.splice(0)
		}
		if (info.length) {
			if (limit[1].type == 'l') {
				info[0] = `cooldown ${info[0]}s`
			}
			toChat += '; ' + info.join(', ');
		}
		toChats.push(toChat);
	}
	let toChat = `== ${limitCount} limits ==
` + toChats.join('\n');
	clientChatResponse(toChat);
}, null, 'list all current user limits');

register_chat_command('...listglobal', function(args) {
	let limitCount = 0;
	let toChats = [];
	for (let limit of Object.entries(nm_globalLimits)) {
		if (Date.now() >= limit[1].expire) continue;
		limitCount += 1;
		let toChat;
		toChat = `• y = ${limit[0]}; type ${limit[1].type}`
		if (limit[1].expire >= 0xfffffffffff) {
			toChat += `; expires never`;
		} else {
			let expireDate = new Date(limit[1].expire);
			let expireString = expireDate.toISOString();
			let msToExpire = limit[1].expire - Date.now();
			let relativeExpireString = msToExpire / 1000 + 's';
			toChat += `; expires ${expireString} (${relativeExpireString})`;
		}
		let info = [...limit[1].info];
		let lastNonZero = info.findLastIndex(e => e != 0);
		if (lastNonZero >= 0) {
			info.splice(lastNonZero + 1)
		} else {
			info.splice(0)
		}
		if (info.length) {
			if (limit[1].type == 'l') {
				info[0] = `cooldown ${info[0]}s`
			}
			toChat += '; ' + info.join(', ');
		}
		toChats.push(toChat);
	}
	let toChat = `== ${limitCount} limits ==
` + toChats.join('\n');
	clientChatResponse(toChat);
}, null, 'list all current global limits');

if (localStorage.networkWarning != 'true') {
	clientChatResponse(`== WARNING ==
moderation will not function on 'This page' tab of /...network.
please chat on the shared chat always using the '...network' tab.`);
	localStorage.networkWarning = true;
}
