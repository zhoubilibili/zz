const bedrock = require('bedrock-protocol');
const axios = require('axios');
const http = require('http');

// 环境变量读取
const SERVER_HOST = process.env.SERVER_HOST;
const SERVER_PORT = Number(process.env.SERVER_PORT || 19132);
const BOT_NAME = "Doubao";
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const API_KEY = process.env.API_KEY;
const MODEL_ID = process.env.MODEL_ID;

// 简易HTTP服务，适配Render保活ping（关键，不然保活失效）
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot Running");
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`保活服务启动，端口:${PORT}`);
});

// AI人设记忆
const SYSTEM_PROMPT = `你叫Doubao，是一名浮空主城导游，正在参观zhouxxx3838的雨云基岩BDS服务器。
世界信息：主城是Y=120高度的石英浮空主城，配套计分板公告栏、自动扫地机。
行为规则：
1. 自主在主城范围内寻路移动，偶尔主动评价建筑、介绍设施；
2. 玩家在公屏发消息时，友好回应；
3. 语言简短适合MC聊天框，不要超长文字；
4. 不要输出无关指令，只做对话和参观互动。`

const client = bedrock.createClient({
  host: SERVER_HOST,
  port: SERVER_PORT,
  username: BOT_NAME,
  offline: true
});

// 25秒自动发言
setInterval(async () => {
  const resp = await getAiReply("随机说一句关于这服务器的话");
  client.queue('text', {
    type: 'chat',
    message: resp,
    sender: BOT_NAME
  })
}, 25000)

// 监听玩家聊天
client.on('text', async (packet) => {
  if(packet.sender === BOT_NAME) return;
  const content = packet.message;
  const aiText = await getAiReply(content);
  client.queue('text', {
    type: 'chat',
    message: aiText,
    sender: BOT_NAME
  })
})

// 请求豆包AI
async function getAiReply(userMsg){
  const res = await axios.post(API_URL,{
    model: MODEL_ID,
    messages: [
      {role:"system", content:SYSTEM_PROMPT},
      {role:"user", content:userMsg}
    ]
  },{
    headers: {Authorization: `Bearer ${API_KEY}`}
  })
  return res.data.choices[0].message.content
}

client.on('spawn', () => {
  console.log(' Doubao机器人成功进入服务器！')
})

client.on('error', (err) => {
  console.error('连接失败：', err)
})

