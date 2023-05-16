function formatDate(now) {
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var date = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();
	var second = now.getSeconds();
	return year + "-" + (month = month < 10 ? ("0" + month) : month) + "-" + (date = date < 10 ? ("0" + date) : date) + " " + (hour = hour < 10 ? ("0" + hour) : hour) + ":" + (minute = minute < 10 ? ("0" + minute) : minute) + ":" + (second = second < 10 ? ("0" + second) : second);
}

var websocket;

function addsocket() {

	var wsaddr = "ws://127.0.0.1:10100/websocket";
	StartWebSocket(wsaddr);
}


function StartWebSocket(wsUri) {
	websocket = new WebSocket(wsUri);
	websocket.binaryType = 'arraybuffer';

	websocket.onopen = function (evt) {
		onOpen(evt, wsUri)
	};
	websocket.onclose = function (evt) {
		onClose(evt)
	};
	websocket.onmessage = function (evt) {
		onMessage(evt)
	};
	websocket.onerror = function (evt) {
		onError(evt)
	};
}

function onOpen(evt, wsUri) {
	writeToScreen("<span style='color:red'>连接成功，现在你可以发送信息进行测试了！</span>");
	writeToScreen(wsUri);
}

function onClose(evt) {
	writeToScreen("<span style='color:red'>Websocket连接已断开！</span>");
	websocket.close();
}

function binaryData(data) {
	return JSON.parse(new TextDecoder("utf-8").decode(new Uint8Array(data)))
}

function onMessage(evt) {
	console.log('onMessage')
	console.log(evt.data)
	let externalMessage = binaryData(evt.data);
	console.log(externalMessage)
	let bizData = externalMessage.data;
	let cmd = getCmd(externalMessage.cmdMerge)
	let subCmd = getSubCmd(externalMessage.cmdCode)

	externalMessage.cmdMerge = cmd
	externalMessage.cmdCode = subCmd
	let json = ''
	if (bizData) {
		let bizDataJson = binaryData(bizData);
		externalMessage.data = bizDataJson;
		json = JSON.stringify(externalMessage);
	}

	//

	//
	writeToScreen('<span style="color:blue">服务端回应&nbsp;' + formatDate(new Date()) + '</span><br/><span>' + json + '</span>');
}

function onError(evt) {
	writeToScreen('<span style="color: red;">发生错误:</span> ' + evt.data);
}

function SendMessage() {
	const sendMsg = $("#sendMsg").val()
	console.log(sendMsg)
	if (!sendMsg) {
		alert("消息体错误")
		return
	}

	json = JSON.parse(sendMsg)

	var externalMessageBytes = createExternalMessage(json);
	if (!externalMessageBytes) {
		alert("路由信息错误")
		return
	}

	console.log(externalMessageBytes)

	websocket.send(externalMessageBytes);
}

/**
 * 封装消息，data为业务数据
 * @param data
 * @returns {Uint8Array}
 */
function createExternalMessage(data) {
	const cmd = $("#cmd").val()
	const subCmd = $("#subCmd").val()
	if (cmd === '' || subCmd === '') {
		return false;
	}
	const cmdMerge = getMergeCode(parseInt(cmd), parseInt(subCmd))

	var message = {
		cmdCode: 1,
		cmdMerge: cmdMerge,
		data: data
	}

	var json = JSON.stringify(message);
	writeToScreen('<span style="color:green">你发送的信息&nbsp;' + formatDate(new Date()) + '</span><br/>' + json);

	var textEncoder = new TextEncoder();
	var dataArray = textEncoder.encode(JSON.stringify(data));
	message.data = Array.from(dataArray);
	const sendJson = JSON.stringify(message);

	return textEncoder.encode(sendJson);
}

function writeToScreen(message) {
	var div = "<div>" + message + "</div>";
	var d = $("#output");
	var d = d[0];
	var doScroll = d.scrollTop == d.scrollHeight - d.clientHeight;
	$("#output").append(div);
	if (doScroll) {
		d.scrollTop = d.scrollHeight - d.clientHeight;
	}
}

window.onload=function () {
	$("#send").on('click', function () {
		SendMessage()
	})
}

function getMergeCode(cmd, subCmd) {
	return (cmd << 16) + subCmd
}

function getSubCmd(cmdMerge) {
	return cmdMerge & 0xFFFF
}

function getCmd(cmdMerge) {
	return cmdMerge >> 16
}



