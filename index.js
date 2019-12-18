const Client = require("discord-no-cache");

class TagBot {
    constructor() {
        this.debugFN = () => {};
        
        this.prefix = [];
        this.mentionPrefix = false;
        this.user = "";
        
        this.commands = new Map();
        
        this.log = () => {};
    }

    addPrefix(prefix) {
        this.prefix.push(prefix);
        return this
    }
    setMentionPrefix(bool) {
        if(bool) this.mentionPrefix = true
        else this.mentionPrefix = false
        return this;
    }
    
    addCommand(commandName, commandResponse, autoDelete) {
        this.commands.set(commandName, {res: commandResponse, del: autoDelete});
        return this;
    }
    runCommand(commandName, message) {
        let response = this.commands.get(commandName);
        if(!response || !response.res) return;
        this.log(`${message.author.username}#${message.author.discriminator} ran command: ${commandName}`);
        if((typeof response.res) == "function") response.res(message, this.bindMessage(message.channel_id));
        else this.client.send(message.channel_id, this.resolveCommand(response.res, message));
        if(response.del) this.client.deleteMessage(message.channel_id, message.id).catch(()=>{});
    }
    resolveCommand(content, message) {
        return content
            .replace(/{author}/gi, `<@${message.author.id}>`)
    }
    
    bindMessage(channelID) {
        return (content) => {
            this.client.send(channelID, content);
        }
    }
    
    setDebug(fn) {
        this.debugFN = fn;
        return this;
    }
    setLog(fn) {
        this.log = fn;
        return this;
    }
    
    login(token, extraopts) {
        this.client = new Client(token, 
            {dontStart: true, ...extraopts}, 
            (...args) => {
                this.debugFN(...args);
            }
        );
        this.setup();
        return this.client;
    }
    
    setup() {
        this.client.on("MESSAGE_CREATE", (message) => {
            message.content = message.content.toLowerCase();
            let prefixes = this.prefix;
            if(this.mentionPrefix) prefixes = [...prefixes, ...[`<@${this.user.id}> `, `<@!${this.user.id}> `]];
			let space = false
			const prefix = ([
				...this.prefix,
				...(this.mentionPrefix ? [`<@${this.user.id}>`, `<@!${this.user.id}>`] : [])
			].find(prefix => {
				if (message.content.startsWith(prefix)) {
					if (prefix.startsWith("<@")) space = true
					return true
				}
			}))
            if(!prefix) return;
            var commandName = message.content.slice(`${prefix}${space ? " " : ""}`.length);
            
            this.runCommand(commandName, message);
        })
        this.client.on("READY", (data) => {
            this.user = data.user;
            this.log(`Logged in as ${data.user.username}#${data.user.discriminator}`);
        })
        
        this.client.start();
    }
}

module.exports = TagBot;