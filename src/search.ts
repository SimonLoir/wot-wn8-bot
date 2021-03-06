import { db } from './database';
import * as fs from 'fs';
//@ts-ignore
import * as Discord from 'discord.js';
import { wn8, getColor } from './wn8';

export async function search(msg: string, message: any) {
    let database = new db();
    const username = msg.replace('search ', '').trim();
    const user_search = await database.query(
        'SELECT * FROM users WHERE user_name = ?',
        [username]
    );
    if (user_search.length != 1)
        return message.channel.send(
            'Could not find the user, it may not be indexed in our database yet.'
        );
    const { user_id, user_name } = user_search[0];
    const snapshot = await database.query(
        'SELECT * FROM snapshots WHERE pid = ? ORDER BY id DESC LIMIT 1',
        [user_id]
    );
    const url = `https://wn8master.games/${user_id}`;
    if (snapshot.length != 1)
        return message.channel.send(
            `No snapshot found ! 
Visit ${url} to create one :-)`
        );

    const expected = JSON.parse(
        fs.readFileSync(process.env.FILES + 'exp.json', 'utf8')
    );
    const stats: api_tanks_stats[] = (
        await database.query('SELECT * FROM snapshots_data WHERE id = ?', [
            snapshot[0].id,
        ])
    ).map((data: any) => JSON.parse(data.data));
    const global = {
        IDNum: 0,
        expDef: 0,
        expFrag: 0,
        expSpot: 0,
        expDamage: 0,
        expWinRate: 0,
    };
    const all = {
        damage_dealt: 0,
        spotted: 0,
        frags: 0,
        dropped_capture_points: 0,
        wins: 0,
        battles: 0,
    };
    console.time('Compute duration');
    stats.forEach((tank) => {
        all.damage_dealt += tank.damage_dealt;
        all.spotted += tank.spotted;
        all.frags += tank.frags;
        all.dropped_capture_points += tank.dropped_capture_points;
        all.wins += tank.wins;
        all.battles += tank.battles;

        const avg_damages = tank.damage_dealt / tank.battles;
        const avg_xp = tank.xp / tank.battles;
        const avg_spot = tank.spotted / tank.battles;
        const avg_frag = tank.frags / tank.battles;
        const avg_def = tank.dropped_capture_points / tank.battles;
        const avg_win_rate = (100 * tank.wins) / tank.battles;

        let wn8: number;
        try {
            const tank_expected = expected[tank.tank_id];
            global.expDamage += tank.battles * tank_expected.expDamage;
            global.expDef += tank.battles * tank_expected.expDef;
            global.expFrag += tank.battles * tank_expected.expFrag;
            global.expSpot += tank.battles * tank_expected.expSpot;
            global.expWinRate += 0.01 * tank.battles * tank_expected.expWinRate;
        } catch (error) {
            wn8 = -1;
        }
    });

    const r_damage = all.damage_dealt / global.expDamage;
    const r_spot = all.spotted / global.expSpot;
    const r_frags = all.frags / global.expFrag;
    const r_def = all.dropped_capture_points / global.expDef;
    const r_winrate = all.wins / global.expWinRate;

    const global_wn8 = wn8(r_damage, r_spot, r_frags, r_def, r_winrate);
    console.timeEnd('Compute duration');

    const content = new Discord.RichEmbed();
    content.setTitle(user_name);
    content.setDescription(`Username : ${user_name} #${user_id}
Last update : ${snapshot[0].date}
WN8 : ${global_wn8.toFixed(2)}
Battles : ${all.battles}
Win ratio : ${((100 * all.wins) / all.battles).toFixed(2)} %
Frags : ${(all.frags / all.battles).toFixed(2)} / battle


Link to update : ${url}
            `);
    content.setColor(getColor(global_wn8, false));
    message.channel.send(content);
}
