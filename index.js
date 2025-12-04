const Discord = require('discord.js');
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = '!';
const userXP = new Map();
const userWarnings = new Map();
const polls = new Map();

client.on('ready', () => {
    console.log(`Bot online como ${client.user.tag}`);
    client.user.setActivity('!ajuda | Mega Code', { type: 'WATCHING' });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    addXP(message.author.id);

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ajuda' || command === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 Comandos do Bot Mega Code')
            .setDescription('Aqui estão todos os comandos disponíveis:')
            .addFields(
                { name: '💻 Programação', value: '`!analisar <código>` - Analisa código\n`!executar <código>` - Executa JavaScript\n`!docs <termo>` - Busca documentação' },
                { name: '🛡️ Moderação', value: '`!ban @user` - Banir membro\n`!kick @user` - Expulsar membro\n`!timeout @user <tempo>` - Silenciar\n`!warn @user <motivo>` - Advertir\n`!limpar <quantidade>` - Deletar mensagens' },
                { name: '🎮 Diversão', value: '`!ping` - Ver latência\n`!avatar [@user]` - Ver avatar\n`!serverinfo` - Info do servidor\n`!userinfo [@user]` - Info do usuário' },
                { name: '📊 Utilidades', value: '`!enquete <pergunta>` - Criar enquete\n`!nivel [@user]` - Ver XP/nível\n`!ranking` - Top 10 usuários\n`!lembrar <tempo> <mensagem>` - Lembrete' },
                { name: '🎲 Jogos', value: '`!dado` - Rolar dado\n`!coinflip` - Cara ou coroa\n`!8ball <pergunta>` - Bola 8 mágica' }
            )
            .setFooter({ text: 'Mega Code Bot' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'analisar' || command === 'analyze') {
        const code = args.join(' ');
        if (!code) return message.reply('❌ Você precisa fornecer um código para analisar!');

        const issues = [];
        
        if (code.includes('cons t') || code.includes('le t') || code.includes('va r')) {
            issues.push('🔴 **Erro de sintaxe**: Espaço entre declaração de variável (const, let, var)');
        }
        if (code.match(/const\s+\w+\s*=(?!\s*\()/g) && code.includes('const') && !code.includes(';')) {
            issues.push('🟡 **Aviso**: Faltando ponto e vírgula no final da declaração');
        }
        if (code.includes('==') && !code.includes('===')) {
            issues.push('🟡 **Recomendação**: Use === ao invés de == para comparação estrita');
        }
        if (code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) && !code.includes('return')) {
            issues.push('🟡 **Aviso**: Função sem retorno explícito');
        }
        if (code.includes('var ')) {
            issues.push('🟡 **Recomendação**: Prefira usar const ou let ao invés de var');
        }
        if (code.match(/{\s*[^}]+\s*}/g) && !code.match(/{\s*\n/g)) {
            issues.push('🔵 **Estilo**: Considere adicionar quebras de linha para melhor legibilidade');
        }
        if (code.includes('console.log') && code.split('console.log').length > 3) {
            issues.push('🟡 **Debug**: Muitos console.log detectados, lembre-se de removê-los em produção');
        }
        if (code.match(/\(/g) && code.match(/\)/g) && code.match(/\(/g).length !== code.match(/\)/g).length) {
            issues.push('🔴 **Erro**: Parênteses não balanceados');
        }
        if (code.match(/{/g) && code.match(/}/g) && code.match(/{/g).length !== code.match(/}/g).length) {
            issues.push('🔴 **Erro**: Chaves não balanceadas');
        }
        if (code.includes('await') && !code.includes('async')) {
            issues.push('🔴 **Erro**: Uso de await sem função async');
        }

        const embed = new EmbedBuilder()
            .setColor(issues.length === 0 ? '#00ff00' : '#ff0000')
            .setTitle('🔍 Análise de Código')
            .addFields({ name: '📝 Código Analisado', value: '```javascript\n' + code.slice(0, 1000) + '\n```' });

        if (issues.length > 0) {
            embed.addFields({ name: '⚠️ Problemas Encontrados', value: issues.join('\n') });
            embed.addFields({ name: '💡 Dica', value: 'Corrija os erros e tente novamente!' });
        } else {
            embed.addFields({ name: '✅ Resultado', value: 'Código sem problemas detectados!' });
        }

        message.reply({ embeds: [embed] });
    }

    if (command === 'executar' || command === 'eval') {
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ Apenas o dono do servidor pode executar código!');
        }

        const code = args.join(' ');
        if (!code) return message.reply('❌ Forneça código para executar!');

        try {
            let result = eval(code);
            if (typeof result !== 'string') result = require('util').inspect(result);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Código Executado')
                .addFields(
                    { name: '📥 Input', value: '```javascript\n' + code.slice(0, 1000) + '\n```' },
                    { name: '📤 Output', value: '```javascript\n' + result.slice(0, 1000) + '\n```' }
                );
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Erro na Execução')
                .addFields(
                    { name: '📥 Input', value: '```javascript\n' + code.slice(0, 1000) + '\n```' },
                    { name: '⚠️ Erro', value: '```javascript\n' + error.toString().slice(0, 1000) + '\n```' }
                );
            
            message.reply({ embeds: [embed] });
        }
    }

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Você não tem permissão para banir membros!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Mencione um usuário para banir!');
        if (!member.bannable) return message.reply('❌ Não posso banir este usuário!');

        const reason = args.slice(1).join(' ') || 'Sem motivo especificado';
        
        await member.ban({ reason });
        message.reply(`✅ ${member.user.tag} foi banido! Motivo: ${reason}`);
    }

    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ Você não tem permissão para expulsar membros!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Mencione um usuário para expulsar!');
        if (!member.kickable) return message.reply('❌ Não posso expulsar este usuário!');

        const reason = args.slice(1).join(' ') || 'Sem motivo especificado';
        
        await member.kick(reason);
        message.reply(`✅ ${member.user.tag} foi expulso! Motivo: ${reason}`);
    }

    if (command === 'timeout') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Você não tem permissão para silenciar membros!');
        }

        const member = message.mentions.members.first();
        const time = args[1];
        
        if (!member) return message.reply('❌ Mencione um usuário!');
        if (!time) return message.reply('❌ Especifique o tempo! Ex: 10m, 1h, 1d');

        const duration = parseDuration(time);
        if (!duration) return message.reply('❌ Formato de tempo inválido!');

        await member.timeout(duration, args.slice(2).join(' ') || 'Sem motivo');
        message.reply(`✅ ${member.user.tag} foi silenciado por ${time}!`);
    }

    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Você não tem permissão para advertir!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Mencione um usuário!');

        const reason = args.slice(1).join(' ') || 'Sem motivo';
        
        if (!userWarnings.has(member.id)) {
            userWarnings.set(member.id, []);
        }
        
        userWarnings.get(member.id).push({ reason, date: new Date(), by: message.author.tag });
        
        message.reply(`⚠️ ${member.user.tag} recebeu uma advertência! Total: ${userWarnings.get(member.id).length}`);
    }

    if (command === 'limpar' || command === 'clear') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Você não tem permissão para gerenciar mensagens!');
        }

        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Especifique um número entre 1 e 100!');
        }

        await message.channel.bulkDelete(amount + 1, true);
        const reply = await message.channel.send(`✅ ${amount} mensagens deletadas!`);
        setTimeout(() => reply.delete(), 3000);
    }

    if (command === 'ping') {
        const msg = await message.reply('🏓 Calculando...');
        const latency = msg.createdTimestamp - message.createdTimestamp;
        msg.edit(`🏓 Pong! Latência: ${latency}ms | API: ${Math.round(client.ws.ping)}ms`);
    }

    if (command === 'avatar') {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Avatar de ${user.tag}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }));
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'serverinfo') {
        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 Informações do ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true },
                { name: '💬 Canais', value: `${guild.channels.cache.size}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '🎭 Cargos', value: `${guild.roles.cache.size}`, inline: true }
            );
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'userinfo') {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`👤 Informações de ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Conta criada', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
                { name: '📥 Entrou em', value: member.joinedAt.toLocaleDateString('pt-BR'), inline: true },
                { name: '🎭 Cargos', value: member.roles.cache.map(r => r).join(' ').slice(0, 1024) || 'Nenhum' }
            );
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'enquete' || command === 'poll') {
        const question = args.join(' ');
        if (!question) return message.reply('❌ Faça uma pergunta!');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Enquete')
            .setDescription(question)
            .setFooter({ text: `Por ${message.author.tag}` });

        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('👍');
        await msg.react('👎');
        
        message.delete();
    }

    if (command === 'nivel' || command === 'level') {
        const user = message.mentions.users.first() || message.author;
        const xp = userXP.get(user.id) || 0;
        const level = Math.floor(xp / 100);
        const nextLevel = (level + 1) * 100;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📈 Nível de ${user.tag}`)
            .addFields(
                { name: '⭐ Nível', value: `${level}`, inline: true },
                { name: '✨ XP', value: `${xp}/${nextLevel}`, inline: true },
                { name: '📊 Progresso', value: `${Math.floor((xp % 100) / 100 * 100)}%`, inline: true }
            );
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'ranking' || command === 'top') {
        const sorted = Array.from(userXP.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        let description = '';
        for (let i = 0; i < sorted.length; i++) {
            const user = await client.users.fetch(sorted[i][0]);
            const xp = sorted[i][1];
            const level = Math.floor(xp / 100);
            description += `${i + 1}. **${user.tag}** - Nível ${level} (${xp} XP)\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Ranking Top 10')
            .setDescription(description || 'Nenhum dado ainda');
        
        message.reply({ embeds: [embed] });
    }

    if (command === 'lembrar' || command === 'reminder') {
        const time = args[0];
        const reminder = args.slice(1).join(' ');
        
        if (!time || !reminder) return message.reply('❌ Use: !lembrar <tempo> <mensagem>');
        
        const duration = parseDuration(time);
        if (!duration) return message.reply('❌ Formato de tempo inválido!');
        
        message.reply(`✅ Ok! Vou te lembrar em ${time}`);
        
        setTimeout(() => {
            message.author.send(`⏰ **Lembrete:** ${reminder}`).catch(() => {});
            message.reply(`<@${message.author.id}> ⏰ **Lembrete:** ${reminder}`);
        }, duration);
    }

    if (command === 'dado' || command === 'roll') {
        const result = Math.floor(Math.random() * 6) + 1;
        message.reply(`🎲 Você rolou um **${result}**!`);
    }

    if (command === 'coinflip' || command === 'moeda') {
        const result = Math.random() < 0.5 ? 'Cara' : 'Coroa';
        message.reply(`🪙 Resultado: **${result}**!`);
    }

    if (command === '8ball') {
        const responses = [
            'Sim', 'Não', 'Talvez', 'Com certeza', 'Não sei dizer',
            'Pergunte novamente', 'Melhor não dizer agora', 'Definitivamente sim',
            'Minhas fontes dizem que não', 'Perspectiva boa', 'Não conte com isso'
        ];
        
        const question = args.join(' ');
        if (!question) return message.reply('❌ Faça uma pergunta!');
        
        const answer = responses[Math.floor(Math.random() * responses.length)];
        message.reply(`🎱 **Pergunta:** ${question}\n**Resposta:** ${answer}`);
    }

    if (command === 'docs') {
        const term = args.join(' ');
        if (!term) return message.reply('❌ Especifique o que procura!');
        
        const links = {
            'javascript': 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript',
            'python': 'https://docs.python.org/pt-br/3/',
            'discord.js': 'https://discord.js.org/',
            'react': 'https://react.dev/',
            'node': 'https://nodejs.org/docs/',
            'html': 'https://developer.mozilla.org/pt-BR/docs/Web/HTML',
            'css': 'https://developer.mozilla.org/pt-BR/docs/Web/CSS'
        };
        
        const url = links[term.toLowerCase()] || `https://www.google.com/search?q=${term}+documentation`;
        
        message.reply(`📚 Documentação: ${url}`);
    }
});

function addXP(userId) {
    const current = userXP.get(userId) || 0;
    const gain = Math.floor(Math.random() * 15) + 5;
    userXP.set(userId, current + gain);
}

function parseDuration(str) {
    const units = {
        's': 1000,
        'm': 60000,
        'h': 3600000,
        'd': 86400000
    };
    
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    return parseInt(match[1]) * units[match[2]];
}

client.login('SEU_TOKEN_AQUI');
