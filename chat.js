n_socket = new ReconnectingWebSocket('wss://ourworldoftext.com/...network/ws/');
if (state.worldModel.no_chat_global) {
	elm.chat_upper.style.textAlign = '';
	elm.chat_page_tab.style.minWidth = '80px';
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
		data.type = chatType(data.registered, data.nickname, data.realUsername);
		n_addChat(data.id, data.type, data.nickname, data.message, data.realUsername,
				  data.op, data.admin, data.staff, data.color, data.date || Date.now(), data.dataObj);
	}
}
