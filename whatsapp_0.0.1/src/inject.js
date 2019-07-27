var ultimateMessage = {}

WAPI.waitNewMessages(false, (data) => {
    data.forEach((message) => {
        let group2 = "558197490506-1562281960@g.us"
        let group1 = "558197490506-1562285000@g.us"
        var response = "";
        const getBody = (message) => message.type!== "image" ? message.body : "" 
        const getMessage = (list) => list.map(getBody).reverse().join('\n')
        const sendUserFinalMessage = (message) => {
            if (message.type == "chat") {    
                ultimateMessage[message.sender.id] = message
                response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + message.body
                WAPI.sendSeen(group2);
                WAPI.sendMessage2(group2, response);
            } 

            if (message.type == "image") {
                message.processMedia.then(function(mediaBlob){
                    ultimateMessage[message.sender.id] = message
                    response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + (message.caption !== undefined ? message.caption : "")
                    WAPI.sendImage2(mediaBlob,group2, response);
                });
            }
        }

        const sendGroupFinalMessage = (message) => {
            if (message.quotedMsg.type == "chat" || message.quotedMsg.type == "image") {
                message.quotedMsg.type == "chat" ? resp = message.quotedMsg.body.toString() : resp = message.quotedMsg.caption.toString()
                id = resp.substring(resp.indexOf("+")+1,resp.indexOf("\n"))+"@c.us"
                contato = WAPI.getContact(message.author)
                finalMessage = ultimateMessage[id]
                finalMessage.from._serialized = id
                finalMessage.body = contato.pushname + ":\n"+ message.body
                message = finalMessage
                WAPI.sendSeen(message.from._serialized);
                WAPI.sendMessage2(message.from._serialized, message.body);
            }
            /*
            if (message.quotedMsg.type == "image") {
                
                resp = message.quotedMsg.caption.toString()
                id = resp.substring(resp.indexOf("+")+1,resp.indexOf("\n"))+"@c.us"
                contato = WAPI.getContact(id)
                finalMessage = ultimateMessage[id]
                finalMessage.from._serialized = id
                finalMessage.body = message.body
                finalMessage.type = message.quotedMsg.type
                finalMessage["caption"] = message.caption
                message = finalMessage
                message.processMedia.then(function(mediaBlob){
                    ultimateMessage[message.sender.id] = message
                    response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") + '\n' + (message.caption !== undefined ? message.caption : "")
                    WAPI.sendImage2(mediaBlob,message.from._serialized, response);
                });
            }
            */


        }

        const sendUserFinalMessageTrigger = (message) => {
            if (message.type == "image") {
                message.processMedia.then(function(mediaBlob){
                    ultimateMessage[message.sender.id] = message
                    response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + (message.caption !== undefined ? message.caption : "")
                    WAPI.sendImage2(mediaBlob,group2, response);
                });
            }

            if(message.body.match('#')){
                ultimateMessage[message.sender.id] = message
                let list = WAPI.getUnreadMessagesInChat(message.chat.id)
                response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + getMessage(list)
                WAPI.sendSeen(group2);
                WAPI.sendMessage2(group2, response);
            }
            
        }

        const sendListMessage = (message) => {  
            ultimateMessage[message.sender.id] = message
            let list = WAPI.getUnreadMessagesInChat(message.chat.id)
            response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + getMessage(list)
            WAPI.sendSeen(group2);
            WAPI.sendMessage2(group2, response);
            delete this.timeoutID;
        }

        const cancelar = () => window.clearTimeout(this.timeoutID)
            
        const setup = (message) => {
            if (typeof this.timeoutID === 'number') {
                cancelar();
            }
            timeoutID = setTimeout(() => sendListMessage(message) , 10000);
        }

        const sendUserFinalMessageTime = (message) => {
            if (message.type == "image") {
                message.processMedia.then(function(mediaBlob){
                    ultimateMessage[message.sender.id] = message
                    response = (message.sender.pushname !== undefined ? message.sender.pushname : "Usuário Novo") +' - +' + message.sender.id.toString().substring(message.sender.id.toString().indexOf("@"),0) + '\n' + (message.caption !== undefined ? message.caption : "")
                    WAPI.sendImage2(mediaBlob,group2, response);
                });
            }
            
            if (message.type == "chat") {
                cancelar()
                setup(message)
            }
        }

        window.log(`Message from ${message.sender.pushname}`+" - "+`${message.from.user} checking..`);
            
        if (message.isGroupMsg == true && intents.appconfig.isGroupReply == false) {
            sendGroupFinalMessage(message)
        }else{
            sendUserFinalMessageTime(message)
            //sendUserFinalMessageTrigger(message)
            //sendUserFinalMessage(message)            
        }
    });
});

WAPI.addOptions = function () {
    var suggestions = "";
    intents.smartreply.suggestions.map((item) => {
        suggestions += `<button style="background-color: #eeeeee;
                                margin: 5px;
                                padding: 5px 10px;
                                font-size: inherit;
                                border-radius: 50px;" class="reply-options">${item}</button>`;
    });
    var div = document.createElement("DIV");
    div.style.height = "40px";
    div.style.textAlign = "center";
    div.style.zIndex = "5";
    div.innerHTML = suggestions;
    div.classList.add("grGJn");
    var mainDiv = document.querySelector("#main");
    var footer = document.querySelector("footer");
    footer.insertBefore(div, footer.firstChild);
    var suggestions = document.body.querySelectorAll(".reply-options");
    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        suggestion.addEventListener("click", (event) => {
            console.log(event.target.textContent);
            window.sendMessage(event.target.textContent).then(text => console.log(text));
        });
    }
    mainDiv.children[mainDiv.children.length - 5].querySelector("div > div div[tabindex]").scrollTop += 100;
}