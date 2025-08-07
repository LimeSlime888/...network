n_socket = new ReconnectingWebSocket('wss://ourworldoftext.com/...network/ws/');
elm.chat_page_tab.style.minWidth = '80px';
if (state.worldModel.no_chat_global) {
    elm.chat_upper.style.textAlign = '';
    elm.chat_page_tab.style.display = '';
	elm.usr_online.style.paddingLeft = '';
}
n_chatTab = document.createElement('div');
n_chatTab.innerText = '...network';
n_chatTab.classList.add('chat_tab_button');
n_chatTab.style.minWidth = '80px';
n_chatTab.id = 'chat_network_tab';
elm.chat_network_tab = n_chatTab;
elm.chat_global_tab.after(n_chatTab);
n_chatfield = document.createElement('div');
n_chatfield.classList.add('chatfield');
n_chatfield.style.display = 'none';
n_chatTab.id = 'network_chatfield';
elm.network_chatfield = n_chatTab;
elm.global_chatfield.after(n_chatfield);
n_unreadText = document.createElement('b');
n_unreadText.classList.add('unread');
n_unreadText.id = 'network_unread';
elm.network_unread = n_unreadText;
n_chatTab.append(n_unreadText);
var chatNetworkUnread = 0;
var chatAdditionsNetwork = [];
var initNetworkTabOpen = false;
n_chatTab.addEventListener("click", function() {
	n_chatTab.classList.add("chat_tab_selected");
	elm.chat_page_tab.classList.remove("chat_tab_selected");
	elm.chat_global_tab.classList.remove("chat_tab_selected");

	elm.page_chatfield.style.display = "none";
	elm.global_chatfield.style.display = "none";
	n_chatfield.style.display = "";
	selectedChatTab = 2;
	chatNetworkUnread = 0;

	insertNewChatElementsIntoChatfield(n_chatfield, chatAdditionsNetwork);
	updateUnread();
	if(!initNetworkTabOpen) {
		initNetworkTabOpen = true;
		n_chatfield.scrollTop = n_chatfield.scrollHeight;
	}
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
	insertNewChatElementsIntoChatfield(n_chatfield, chatAdditionsNetwork);
}
function n_onhistory(data) {
    w.emit("chathistory", data)
    var page_prev = data.page_chat_prev;
    for(var p = 0; p < page_prev.length; p++) {
        var chat = page_prev[p];
        if (chat.hide) continue;
        var type = chatType(chat.registered, chat.nickname, chat.realUsername);
        n_addChat(chat.id, type, chat.nickname, chat.message, chat.realUsername,
				  chat.op, chat.admin, chat.staff, chat.color, chat.date, chat);
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
		n_addChat(data.id, data.type, data.nickname, data.message, data.realUsername,
				  data.op, data.admin, data.staff, data.color, data.date || Date.now(), data.dataObj);
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
