//@ts-ignore
import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { search } from './search';
dotenv.config();

if (process.env.DISCORD_TOKEN) {
    const discord = new Discord.Client();

    discord.login(process.env.DISCORD_TOKEN);
    discord.login(process.env.DISCORD_TOKEN);

    discord.on('message', async (message: any) => {
        let msg = message.content;

        if (msg.indexOf('!wn ') != 0) return;
        msg = msg.replace('!wn ', '');

        if (msg.indexOf('search ') == 0) {
            search(msg, message);
        }
    });
}
