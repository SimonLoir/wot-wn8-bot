//@ts-ignore
import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { search } from './search';
import { db } from './database';
dotenv.config();

if (process.env.DISCORD_TOKEN) {
    const discord = new Discord.Client();

    discord.login(process.env.DISCORD_TOKEN);
    discord.login(process.env.DISCORD_TOKEN);

    discord.on('message', async (message: any) => {
        let msg = message.content;

        if (msg.indexOf('!wn ') != 0) return;
        msg = msg.replace('!wn ', '');

        let add_entry = message.content.match(
            /(\s*)result(\s+)(\d+)(\s+)([0-1])/i
        );

        if (msg.indexOf('search ') == 0) {
            search(msg, message);
        } else if (add_entry) {
            const tier = add_entry[3];
            const win = add_entry[5];
            let database = new db();
            const tier_nbr = parseInt(tier);

            if (tier_nbr > 10 || tier_nbr < 0)
                return message.channel.send('Invalid tier');

            await database.query(
                'INSERT INTO battles VALUES (NULL, ?, ?, ?, ?)',
                [
                    (new Date().getTime() / 1000).toFixed(0),
                    win,
                    message.channel.id,
                    tier,
                ]
            );

            const today_timestamp =
                new Date(new Date().toISOString().split('T')[0]).getTime() /
                1000;

            const today: any[] = await database.query(
                'SELECT * FROM battles WHERE ch_id = ? AND time >= ? AND tier = ?',
                [message.channel.id, today_timestamp.toFixed(0), tier]
            );

            let wins = 0;
            today.forEach((e) => {
                if (e.result == 1) wins += 1;
            });
            const win_ratio = today.length == 0 ? 0 : wins / today.length;

            message.channel.send(
                `${
                    win == '1' ? 'Won' : 'Lost'
                } a tier ${tier}\n\nWin ratio for tier ${tier} today : ${Math.floor(
                    win_ratio * 100
                )}%\nBattles played : ${today.length} - ${wins} win`
            );

            await database.end();
        } else {
            message.channel.send('Could not understand the command.');
        }
    });
}
