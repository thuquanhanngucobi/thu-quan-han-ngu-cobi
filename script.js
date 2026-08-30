const app=document.getElementById('app'),toastEl=document.getElementById('toast');
const EXAM={data:HSK4_DATA,section:'idle',studentName:'',timer:null,remaining:0,answers:{},submitted:false,audio:null,audioTimer:null,reviewMode:false,reviewDeadline:0};
function goTop(){window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0}
function setPhaseTimer(seconds,onEnd){clearTimers();EXAM.remaining=seconds;paintTimer();const deadline=Date.now()+seconds*1000;EXAM.timer=setInterval(()=>{EXAM.remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));paintTimer();if(EXAM.remaining<=0){clearInterval(EXAM.timer);EXAM.timer=null;onEnd()}},200);}
const CENTER={address:'K814 H83B/37 Trần Cao Vân, Thanh Khê, Đà Nẵng',contact:'0905655413'};
document.getElementById('center-address').textContent=CENTER.address;document.getElementById('center-contact').textContent=CENTER.contact;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),3000)}
function route(){let h=location.hash.slice(1)||'home';if(['practice','hsk4'].includes(h))renderPracticeHome();else if(h==='knowledge')placeholder('Kiến Thức','Từ vựng, ngữ pháp và kiến thức Hán Ngữ.');else if(h==='review')renderReviewHome();else if(h==='review-hsk')renderReviewHsk();else if(h==='review-hsk2')renderHsk2Vocab();else renderHome();document.querySelectorAll('.main-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===h || (a.dataset.route==='review' && h.startsWith('review'))))}

function renderReviewHome(){app.innerHTML=`<section class="page review-home"><div class="section-title"><span class="cn">温故知新</span><span class="vi">Ôn tập</span></div><p class="review-intro">Ôn lại từ vựng, luyện dịch, luyện đọc và bài tập Hán Ngữ theo trình độ.</p><div class="review-category-grid"><a class="card review-category" href="#review-hsk"><div class="review-symbol">词</div><h3>Từ vựng</h3><p>HSK1–HSK6 và từ vựng chuyên ngành.</p><span class="review-arrow">进入 →</span></a><div class="card review-category disabled-card"><div class="review-symbol">译</div><h3>Luyện dịch</h3><p>Dịch mẫu câu và bài tập giáo viên giao.</p><span class="coming">Sắp mở</span></div><div class="card review-category disabled-card"><div class="review-symbol">读</div><h3>Luyện đọc</h3><p>Đọc đoạn văn không pinyin theo trình độ.</p><span class="coming">Sắp mở</span></div><div class="card review-category disabled-card"><div class="review-symbol">练</div><h3>Bài tập & luyện đề</h3><p>Ngữ pháp, bài tập và luyện đề theo cấp độ.</p><span class="coming">Sắp mở</span></div></div></section>`}

function renderReviewHsk(){app.innerHTML=`<section class="page"><div class="section-title"><span class="cn">词汇复习</span><span class="vi">Từ vựng HSK</span></div><div class="level-grid">${[1,2,3,4,5,6].map(n=>n===2?`<a class="level-card selected" href="#review-hsk2"><span>HSK ${n}</span><small>Đang mở</small></a>`:`<div class="level-card muted-level"><span>HSK ${n}</span><small>Sắp mở</small></div>`).join('')}</div><div class="back-row"><a class="btn secondary" href="#review">← Quay lại Ôn tập</a></div></section>`}

function renderHsk2Vocab(){
  const total=HSK2_VOCAB.length;
  const saved=JSON.parse(localStorage.getItem('cobi_hsk2_vocab')||'{}');
  let current=0,mode='list',quiz=[],quizIndex=0,quizScore=0,quizType='meaning';
  const EXAMPLES={
    '班':['我们班有二十个学生。','Wǒmen bān yǒu èrshí gè xuéshēng.','Lớp chúng tôi có 20 học sinh。'],
    '帮':['你能帮我一下吗？','Nǐ néng bāng wǒ yíxià ma?','Bạn có thể giúp tôi một chút không?'],
    '帮忙':['谢谢你帮忙。','Xièxie nǐ bāngmáng.','Cảm ơn bạn đã giúp đỡ.'],
    '包':['这个包很漂亮。','Zhège bāo hěn piàoliang.','Cái túi này rất đẹp.'],
    '本子':['我需要买一个新本子。','Wǒ xūyào mǎi yí gè xīn běnzi.','Tôi cần mua một quyển vở mới.'],
    '比':['今天比昨天冷。','Jīntiān bǐ zuótiān lěng.','Hôm nay lạnh hơn hôm qua.'],
    '笔':['这支笔是谁的？','Zhè zhī bǐ shì shéi de?','Cây bút này là của ai?'],
    '别':['别说话，认真听课。','Bié shuōhuà, rènzhēn tīngkè.','Đừng nói chuyện, hãy tập trung nghe giảng.'],
    '不错':['他的汉语说得不错。','Tā de Hànyǔ shuō de búcuò.','Tiếng Trung của anh ấy nói khá tốt.'],
    '不好意思':['真不好意思，我迟到了。','Zhēn bù hǎoyìsi, wǒ chídào le.','Thật ngại quá, tôi đến muộn rồi.'],
    '长':['这条路很长。','Zhè tiáo lù hěn cháng.','Con đường này rất dài.'],
    '车站':['我们在车站见面吧。','Wǒmen zài chēzhàn jiànmiàn ba.','Chúng ta gặp nhau ở bến xe nhé.'],
    '出国':['他明年打算出国留学。','Tā míngnián dǎsuàn chūguó liúxué.','Anh ấy dự định năm sau đi du học nước ngoài.'],
    '出门':['记得关门再出门。','Jìde guānmén zài chūmén.','Nhớ đóng cửa rồi hãy ra ngoài.'],
    '出去':['他刚刚出去了。','Tā gānggāng chūqu le.','Anh ấy vừa mới đi ra ngoài rồi.'],
    '床':['床上有一本书。','Chuáng shang yǒu yì běn shū.','Trên giường có một quyển sách.'],
    '词':['这个词是什么意思？','Zhège cí shì shénme yìsi?','Từ này có nghĩa là gì?'],
    '次':['我去过两次北京。','Wǒ qùguo liǎng cì Běijīng.','Tôi từng đi Bắc Kinh hai lần.'],
    '从':['我从早上学到晚上。','Wǒ cóng zǎoshang xué dào wǎnshang.','Tôi học từ sáng đến tối.'],
    '从小':['我从小就喜欢画画儿。','Wǒ cóngxiǎo jiù xǐhuan huàhuàr.','Từ nhỏ tôi đã thích vẽ tranh.'],
    '错':['我做错了一道题。','Wǒ zuòcuò le yí dào tí.','Tôi làm sai một câu hỏi rồi.'],
    '打':['我喜欢打篮球。','Wǒ xǐhuan dǎ lánqiú.','Tôi thích chơi bóng rổ.'],
    '打车':['下雨了，我们打车去吧。','Xiàyǔ le, wǒmen dǎchē qù ba.','Trời mưa rồi, chúng ta bắt taxi đi đi.'],
    '打开':['请打开书，翻到第十页。','Qǐng dǎkāi shū, fān dào dì-shí yè.','Mời mở sách ra, giở đến trang 10.'],
    '但':['他很忙，但还是来了。','Tā hěn máng, dàn háishi lái le.','Anh ấy rất bận nhưng vẫn đến.'],
    '但是':['虽然累，但是很高兴。','Suīrán lèi, dànshì hěn gāoxìng.','Tuy mệt nhưng mà rất vui.'],
    '蛋糕':['生日蛋糕很好吃。','Shēngrì dàngāo hěn hǎochī.','Bánh sinh nhật rất ngon.'],
    '地':['他高兴地笑了。','Tā gāoxìng de xiào le.','Anh ấy cười một cách vui vẻ.'],
    '得':['他跑得非常快。','Tā pǎo de fēicháng kuài.','Anh ấy chạy rất nhanh.'],
    '等':['请等我五分钟。','Qǐng děng wǒ wǔ fēnzhōng.','Xin chờ tôi 5 phút.'],
    '地铁':['坐地铁很方便。','Zuò dìtiě hěn fāngbiàn.','Đi tàu điện ngầm rất tiện lợi.'],
    '点':['现在是上午九点。','Xiànzài shì shàngwǔ jiǔ diǎn.','Bây giờ là 9 giờ sáng.'],
    '懂':['你听懂了吗？','Nǐ tīngdǒng le ma?','Bạn nghe hiểu chưa?'],
    '动':['太累了，我不想动。','Tài lèi le, wǒ bù xiǎng dòng.','Mệt quá rồi, tôi không muốn cử động nữa.'],
    '饭馆':['这家饭馆的菜很好吃。','Zhè jiā fànguǎn de cài hěn hǎochī.','Món ăn quán này rất ngon.'],
    '房子':['他们的房子很大。','Tāmen de fángzi hěn dà.','Căn nhà của họ rất to.'],
    '飞':['小鸟在空中飞。','Xiǎoniǎo zài kōngzhōng fēi.','Chim nhỏ đang bay trên không trung.'],
    '高':['他比我高五厘米。','Tā bǐ wǒ gāo wǔ límǐ.','Anh ấy cao hơn tôi 5 cm.'],
    '高中':['我们是高中同学。','Wǒmen shì gāozhōng tóngxué.','Chúng tôi là bạn học cấp 3.'],
    '告诉':['请告诉我你的名字。','Qǐng gàosu wǒ nǐ de míngzi.','Hãy cho tôi biết tên của bạn.'],
    '个子':['他的个子很高。','Tā de gèzi hěn gāo.','Dáng người của anh ấy rất cao.'],
    '给':['请给我一杯水。','Qǐng gěi wǒ yì bēi shuǐ.','Cho tôi một ly nước.'],
    '跟':['我跟朋友一起去购物。','Wǒ gēn péngyou yìqǐ qù gòuwù.','Tôi đi mua sắm cùng bạn.'],
    '更':['今天比昨天更热。','Jīntiān bǐ zuótiān gèng rè.','Hôm nay còn nóng hơn hôm qua.'],
    '公交车':['我每天坐公交车去上班。','Wǒ měitiān zuò gōngjiāochē qù shàngbān.','Mỗi ngày tôi đều đi xe buýt đi làm.'],
    '过':['过马路要小心。','Guò mǎlù yào xiǎoxīn.','Sang đường phải cẩn thận.'],
    '过来':['你过来一下，我有话要说。','Nǐ guòlái yíxià, wǒ yǒu huà yào shuō.','Bạn qua đây một chút, tôi có chuyện muốn nói.'],
    '过年':['你今年回家过年吗？','Nǐ jīnnián huíjiā guònián ma?','Năm nay bạn có về nhà ăn Tết không?'],
    '过去':['过去的事情就让它过去吧。','Guòqù de shìqing jiù ràng tā guòqù ba.','Chuyện đã qua cứ để nó qua đi.'],
    '还是':['你想喝茶还是咖啡？','Nǐ xiǎng hē chá háishi kāfēi?','Bạn muốn uống trà hay là cà phê?'],
    '好':['衣服我已经洗好了。','Yīfu wǒ yǐjīng xǐhǎo le.','Quần áo tôi đã giặt xong rồi.'],
    '好像':['天阴了，好像要下雨了。','Tiān yīn le, hǎoxiàng yào xiàyǔ le.','Trời nhiều mây rồi, hình như sắp mưa.'],
    '黑色':['我买了一双黑色的鞋。','Wǒ mǎi le yì shuāng hēisè de xié.','Tôi đã mua một đôi giày màu đen.'],
    '红色':['她穿着一件红色的衣服。','Tā chuānzhe yí jiàn hóngsè de yīfu.','Cô ấy đang mặc một chiếc áo màu đỏ.'],
    '后面':['我在他后面。','Wǒ zài tā hòumiàn.','Tôi ở phía sau anh ấy.'],
    '花':['这种花很香。','Zhè zhǒng huā hěn xiāng.','Loại hoa này rất thơm.'],
    '画':['她很喜欢画画儿。','Tā hěn xǐhuan huàhuàr.','Cô ấy rất thích vẽ tranh.'],
    '画笔':['这盒画笔送给你。','Zhè hé huàbǐ sòng gěi nǐ.','Hộp cọ vẽ này tặng cho bạn.'],
    '坏':['手机坏了，不能用了。','Shǒujī huài le, bù néng yòng le.','Điện thoại hỏng rồi, không dùng được nữa.'],
    '回来':['爸爸什么时候回来？','Bàba shénme shíhou huílái?','Bố khi nào trở về?'],
    '回去':['时间不早了，我得回去了。','Shíjiān bù zǎo le, wǒ děi huíqù le.','Thời gian không còn sớm nữa, tôi phải về rồi.'],
    '机场':['我去机场接朋友。','Wǒ qù jīchǎng jiē péngyou.','Tôi đi sân bay đón bạn.'],
    '机票':['我订了一张飞北京的机票。','Wǒ dìng le yì zhāng fēi Běijīng de jīpiào.','Tôi đã đặt một tấm vé máy bay đi Bắc Kinh.'],
    '记得':['你还记得我是谁吗？','Nǐ hái jìde wǒ shì shéi ma?','Bạn còn nhớ tôi là ai không?'],
    '间':['这间房间非常干净。','Zhè jiān fángjiān fēicháng gānjìng.','Căn phòng này cực kỳ sạch sẽ.'],
    '教':['王老师教我们汉语。','Wáng lǎoshī jiāo wǒmen Hànyǔ.','Thầy Vương dạy chúng tôi tiếng Trung.'],
    '教室':['学生们都在教室里。','Xuéshēngmen dōu zài jiàoshì li.','Học sinh đều đang ở trong lớp học.'],
    '接':['我去车站接你。','Wǒ qù chēzhàn jiē nǐ.','Tôi đi ra bến xe đón bạn.'],
    '介绍':['我来介绍一下我的朋友。','Wǒ lái jièshào yíxià wǒ de péngyou.','Để tôi giới thiệu một chút về bạn của tôi.'],
    '进':['请进，随便坐。','Qǐng jìn, suíbiàn zuò.','Mời vào, ngồi tự nhiên nhé.'],
    '进来':['外面冷，快进来吧。','Wàimiàn lěng, kuài jìnlái ba.','Bên ngoài lạnh, mau đi vào trong này đi.'],
    '进去':['里面的门锁了，进不去。','Lǐmiàn de mén suǒ le, jìnbuqù.','Cửa bên trong khóa rồi, không vào được.'],
    '近':['我家离学校很近。','Wǒ jiā lí xuéxiào hěn jìn.','Nhà tôi ở rất gần trường học.'],
    '经常':['他经常去图书馆看书。','Tā jīngcháng qù túshūguǎn kànshū.','Anh ấy thường xuyên đến thư viện đọc sách.'],
    '酒店':['这家酒店环境很好。','Zhè jiā jiǔdiàn huánjìng hěn hǎo.','Khách sạn này có môi trường rất tốt.'],
    '就':['我下课就回家。','Wǒ xiàkè jiù huíjiā.','Tôi tan học liền về nhà.'],
    '咖啡':['我喜欢喝黑咖啡。','Wǒ xǐhuan hē hēi kāfēi.','Tôi thích uống cà phê đen.'],
    '开始':['会议十点开始。','Huìyì shí diǎn kāishǐ.','Cuộc họp bắt đầu lúc 10 giờ.'],
    '开学':['9月1号我们要开学了。','Jiǔ yuè yī hào wǒmen yào kāixué le.','Ngày 1 tháng 9 chúng tôi khai giảng rồi.'],
    '考':['明天要考汉语了。','Míngtiān yào kǎo Hànyǔ le.','Ngày mai phải thi tiếng Trung rồi.'],
    '考试':['祝你考试顺利！','Zhù nǐ kǎoshì shùnlì!','Chúc bạn thi cử thuận lợi!'],
    '可能':['明天可能会下雨。','Míngtiān kěnéng huì xiàyǔ.','Ngày mai có thể sẽ mưa.'],
    '裤子':['这条裤子有点长。','Zhè tiáo kùzi yǒudiǎnr cháng.','Chiếc quần này hơi dài một chút.'],
    '快':['请走快一点。','Qǐng zǒu kuài yìdiǎn.','Xin đi nhanh một chút.'],
    '快乐':['祝你生日快乐！','Zhù nǐ shēngrì kuàilè!','Chúc bạn sinh nhật vui vẻ!'],
    '快要':['火车快要开了。','Huǒchē kuàiyào kāi le.','Tàu hỏa sắp chạy rồi.'],
    '篮球':['他很擅长打篮球。','Tā hěn shàncháng dǎ lánqiú.','Anh ấy rất giỏi chơi bóng rổ.'],
    '累':['工作了一天，我很累。','Gōngzuò le yì tiān, wǒ hěn lèi.','Làm việc một ngày, tôi rất mệt.'],
    '离':['学校离我家不太远。','Xuéxiào lí wǒ jiā bú tài yuǎn.','Trường học cách nhà tôi không xa lắm.'],
    '礼物':['这是送给你的礼物。','Zhè shì sòng gěi nǐ de lǐwù.','Đây là món quà tặng bạn.'],
    '里面':['包里面有什么？','Bāo lǐmiàn yǒu shénme?','Bên trong túi có cái gì?'],
    '楼':['我住在三楼。','Wǒ zhù zài sān lóu.','Tôi sống ở tầng 3.'],
    '路':['这条路很干净。','Zhè tiáo lù hěn gānjìng.','Con đường này rất sạch sẽ.'],
    '路上':['我在去公司的路上。','Wǒ zài qù gōngsī de lùshang.','Tôi đang trên đường đến công ty.'],
    '旅游':['我喜欢去各地旅游。','Wǒ xǐhuan qù gèdì lǚyóu.','Tôi thích đi du lịch các nơi.'],
    '绿色':['绿色的树叶很漂亮。','Lǜsè de shùyè hěn piàoliang.','Lá cây màu xanh lá rất đẹp.'],
    '慢':['请说慢一点。','Qǐng shuō màn yìdiǎn.','Xin hãy nói chậm một chút.'],
    '没意思':['这个电影没意思。','Zhège diànyǐng méi yìsi.','Bộ phim này không hay.'],
    '每':['我每天都跑步。','Wǒ měitiān dōu pǎobù.','Mỗi ngày tôi đều chạy bộ.'],
    '门':['请关上门。','Qǐng guānshàng mén.','Xin hãy đóng cửa lại.'],
    '门口':['我在公司门口等你。','Wǒ zài gōngsī ménkǒu děng nǐ.','Tôi chờ bạn ở cổng công ty.'],
    '门票':['公园门票多少钱？','Gōngyuán ménpiào duōshao qián?','Vé vào cửa công viên bao nhiêu tiền?'],
    '面':['我中午想吃面。','Wǒ zhōngwǔ xiǎng chī miàn.','Buổi trưa tôi muốn ăn mì.'],
    '名':['我们班有三十名学生。','Wǒmen bān yǒu sānshí míng xuéshēng.','Lớp chúng tôi có 30 học sinh.'],
    '拿':['请帮我拿着这个包。','Qǐng bāng wǒ názhe zhège bāo.','Xin hãy giúp tôi cầm chiếc túi này.'],
    '那':['那个人是谁？','Nà gè rén shì shéi?','Người kia là ai?'],
    '那么':['事情没有那么复杂。','Shìqing méiyǒu nàme fùzá.','Mọi chuyện không đến mức phức tạp như vậy.'],
    '那样':['你不能那样做。','Nǐ bù néng nàyàng zuò.','Bạn không thể làm như thế được.'],
    '奶茶':['我想喝一杯冰奶茶。','Wǒ xiǎng hē yì bēi bīng nǎichá.','Tôi muốn uống một ly trà sữa đá.'],
    '奶奶':['奶奶在客厅看电视。','Nǎinai zài kètīng kàn diànshì.','Bà nội đang xem tivi ở phòng khách.'],
    '男孩儿':['那个男孩儿是我弟弟。','Nà gè nánháir shì wǒ dìdi.','Cậu bé kia là em trai tôi.'],
    '鸟':['树上有几只鸟。','Shù shang yǒu jǐ zhī niǎo.','Trên cây có vài con chim.'],
    '女孩儿':['那个女孩儿很可爱。',"Nà gè nǚháir hěn kě'ài.",'Cô bé kia rất đáng yêu.'],
    '旁边':['饭馆旁边有一个超市。','Fànguǎn pángbiān yǒu yí gè chāoshì.','Bên cạnh nhà hàng có một siêu thị.'],
    '跑':['狗在草地上跑。','Gǒu zài cǎodì shang pǎo.','Con chó đang chạy trên cỏ.'],
    '跑步':['我早上习惯去跑步。','Wǒ zǎoshang xíguàn qù pǎobù.','Sáng ra tôi có thói quen đi chạy bộ.'],
    '票':['我买了三张门票。','Wǒ mǎi le sān zhāng ménpiào.','Tôi đã mua 3 tấm vé vào cửa.'],
    '妻子':['他和妻子去旅游了。','Tā hé qīzi qù lǚyóu le.','Anh ấy cùng vợ đi du lịch rồi.'],
    '前面':['前面有一辆车。','Qiánmiàn yǒu yí liàng chē.','Phía trước có một chiếc xe.'],
    '晴':['今天是晴天。','Jīntiān shì qíngtiān.','Hôm nay là một ngày nắng đẹp.'],
    '球':['孩子们在踢球。','Háizimen zài tīqiú.','Bọn trẻ đang đá bóng.'],
    '让':['让我想想再告诉你。','Ràng wǒ xiǎngxiǎng zài gàosu nǐ.','Để tôi suy nghĩ thêm rồi nói cho bạn.'],
    '肉':['我不喜欢吃肥肉。','Wǒ bù xǐhuan chī féiròu.','Tôi không thích ăn thịt mỡ.'],
    '商场':['周末我和朋友去商场买衣服。','Zhōumò wǒ hé péngyou qù shāngchǎng mǎi yīfu.','Cuối tuần tôi cùng bạn đi trung tâm thương mại mua quần áo.'],
    '上来':['你快上来吧，楼上很凉快。','Nǐ kuài shànglái ba, lóushàng hěn liángkuai.','Bạn mau đi lên đây đi, trên tầng rất mát.'],
    '上面':['桌子上面有一本书。','Zhuōzi shàngmiàn yǒu yì běn shū.','Phía trên mặt bàn có một quyển sách.'],
    '上去':['电梯坏了，我们走上去吧。','Diàntī huài le, wǒmen zǒu shàngqù ba.','Thang máy hỏng rồi, chúng ta đi bộ lên đó đi.'],
    '上网':['我喜欢上网查资料。','Wǒ xǐhuan shàngwǎng chá zīliào.','Tôi thích lên mạng tra tài liệu.'],
    '身体':['祝你身体健康！','Zhù nǐ shēntǐ jiànkāng!','Chúc bạn sức khỏe dồi dào!'],
    '生日':['今天是我的生日。','Jīntiān shì wǒ de shēngrì.','Hôm nay là sinh nhật của tôi.'],
    '时':['有空时请给我打电话。','Yǒu kòng shí qǐng gěi wǒ dǎ diànhuà.','Khi rảnh xin hãy gọi điện cho tôi.'],
    '事情':['这件事情很重要。','Zhè jiàn shìqing hěn zhòngyào.','Sự việc này rất quan trọng.'],
    '试':['我可以试一下这件衣服吗？','Wǒ kěyǐ shì yíxià zhè jiàn yīfu ma?','Tôi có thể thử chiếc áo này một chút không?'],
    '手':['请洗手后再吃饭。','Qǐng xǐshǒu hòu zài chīfàn.','Xin hãy rửa tay rồi mới ăn cơm.'],
    '手表':['这块手表很贵。','Zhè kuài shǒubiǎo hěn guì.','Chiếc đồng hồ đeo tay này rất đắt.'],
    '书包':['书包里有很多书。','Shūbāo li yǒu hěn duō shū.','Trong cặp sách có rất nhiều sách.'],
    '舒服':['躺在床上很舒服。','Tǎng zài chuáng shang hěn shūfu.','Nằm trên giường rất thoải mái.'],
    '送':['我送你回家吧。','Wǒ sòng nǐ huíjiā ba.','Để tôi đưa bạn về nhà nhé.'],
    '虽然':['虽然很难，但我不会放弃。','Suīrán hěn nán, dàn wǒ bú huì fàngqì.','Tuy rằng rất khó nhưng tôi sẽ không bỏ cuộc.'],
    '所以':['因为下雨，所以我没去。','Yīnwèi xiàyǔ, suǒyǐ wǒ méi qù.','Vì trời mưa cho nên tôi không đi.'],
    '疼':['我头疼，想休息一下。','Wǒ tóuténg, xiǎng xiūxi yíxià.','Tôi đau đầu, muốn nghỉ ngơi một chút.'],
    '踢':['请不要踢椅子。','Qǐng búyào tī yǐzi.','Xin đừng đá vào ghế.'],
    '题':['这道题很难。','Zhè dào tí hěn nán.','Câu hỏi này rất khó.'],
    '条':['一条鱼','yì tiáo yú','một con cá'],
    '跳舞':['她很喜欢跳舞。','Tā hěn xǐhuan tiàowǔ.','Cô ấy rất thích nhảy múa.'],
    '头':['我的头有点疼。','Wǒ de tóu yǒudiǎnr téng.','Đầu của tôi hơi đau một chút.'],
    '外国':['他去过很多外国城市。','Tā qùguo hěn duō wàiguó chéngshì.','Anh ấy đã từng đi nhiều thành phố nước ngoài.'],
    '外面':['外面天气很好。','Wàimiàn tiānqì hěn hǎo.','Bên ngoài thời tiết rất tốt.'],
    '完':['我看完了这本书。','Wǒ kànwán le zhè běn shū.','Tôi đã đọc xong quyển sách này rồi.'],
    '万':['这台电脑一万块钱。','Zhè tái diànnǎo yí wàn kuài qián.','Chiếc máy tính này giá một vạn nhân dân tệ.'],
    '网上':['我在网上买了一本书。','Wǒ zài wǎngshang mǎi le yì běn shū.','Tôi đã mua một quyển sách trên mạng.'],
    '往':['请往右转。','Qǐng wǎng yòu zhuǎn.','Xin hãy rẽ về phía bên phải.'],
    '忘':['我忘了带钥匙。','Wǒ wàng le dài yàoshi.','Tôi quên mang theo chìa khóa rồi.'],
    '为什么':['你为什么没来？','Nǐ wèishénme méi lái?','Tại sao bạn lại không đến?'],
    '位':['两位先生，请进。','Liǎng wèi xiānsheng, qǐng jìn.','Hai vị tiên sinh, xin mời vào.'],
    '希望':['希望你能来参加我的生日派对。','Xīwàng nǐ néng lái cānjiā wǒ de shēngrì pàiduì.','Hy vọng bạn có thể đến tham dự bữa tiệc sinh nhật của tôi.'],
    '洗':['请洗干净手。','Qǐng xǐ gānjìng shǒu.','Xin hãy rửa sạch tay.'],
    '洗手间':['请问洗手间在哪里？','Qǐngwèn xǐshǒujiān zài nǎli?','Xin hỏi nhà vệ sinh ở đâu vậy?'],
    '下来':['你快下来，饭做好了。','Nǐ kuài xiàlái, fàn zuòhǎo le.','Bạn mau đi xuống đây, cơm nấu xong rồi.'],
    '下面':['树下面有一只猫。','Shù xiàmiàn yǒu yì zhī māo.','Phía dưới gốc cây có một con mèo.'],
    '下去':['走下去就是超市。','Zǒu xiàqù jiù shì chāoshì.','Đi xuống đó chính là siêu thị.'],
    '小孩儿':['小孩儿正在看动画片。','Xiǎoháir zhèngzài kàn dònghuàpiān.','Đứa trẻ đang xem phim hoạt hình.'],
    '小时候':['我小时候住在这里。','Wǒ xiǎoshíhou zhù zài zhèlǐ.','Lúc nhỏ tôi sống ở đây.'],
    '笑':['他笑得很高兴。','Tā xiào de hěn gāoxìng.','Anh ấy cười rất vui vẻ.'],
    '新年':['祝大家新年快乐！','Zhù dàjiā xīnnián kuàilè!','Chúc mọi người năm mới vui vẻ!'],
    '姓':['我姓王，叫王明。','Wǒ xìng Wáng, jiào Wáng Míng.','Tôi họ Vương, tên là Vương Minh.'],
    '姓名':['请在这里写下你的姓名。','Qǐng zài zhèlǐ xiěxià nǐ de xìngmíng.','Xin hãy viết họ và tên của bạn vào đây.'],
    '颜色':['你喜欢什么颜色？','Nǐ xǐhuan shénme yánsè?','Bạn thích màu sắc gì?'],
    '眼睛':['她的眼睛很大。','Tā de yǎnjing hěn dà.','Đôi mắt của cô ấy rất to.'],
    '药':['记得按时吃药。','Jìde ànshí chī yào.','Nhớ uống thuốc đúng giờ.'],
    '药店':['药店就在超市旁边。','Yàodiàn jiù zài chāoshì pángbiān.','Nhà thuốc nằm ngay bên cạnh siêu thị.'],
    '爷爷':['爷爷喜欢看报纸。','Yéye xǐhuan kàn bàozhǐ.','Ông nội thích đọc báo.'],
    '一会儿':['我一会儿就回去。','Wǒ yíhuìr jiù huíqù.','Một lúc nữa tôi sẽ về ngay.'],
    '一起':['我们一起去吃午饭吧。','Wǒmen yìqǐ qù chī wǔfàn ba.','Chúng ta cùng nhau đi ăn trưa nhé.'],
    '已经':['我已经做完作业了。','Wǒ yǐjīng zuòwán zuòyè le.','Tôi đã làm xong bài tập rồi.'],
    '意思':['这是什么意思？','Zhè shì shénme yìsi?','Cái này có nghĩa là gì?'],
    '因为':['因为太忙，所以我没去。','Yīnwèi tài máng, suǒyǐ wǒ méi qù.','Bởi vì quá bận nên tôi không đi.'],
    '阴':['今天是阴天。','Jīntiān shì yīntiān.','Hôm nay là một ngày trời âm u.'],
    '游':['鱼在水里游。','Yú zài shuǐ li yóu.','Cá bơi trong nước.'],
    '游泳':['我夏天喜欢去游泳。','Wǒ xiàtiān xǐhuan qù yóuyǒng.','Mùa hè tôi thích đi bơi.'],
    '有时':['我有时去图书馆读书。','Wǒ yǒushí qù túshūguǎn dúshū.','Tôi thỉnh thoảng đến thư viện đọc sách.'],
    '有意思':['这本书很有意思。','Zhè běn shū hěn yǒuyìsi.','Quyển sách này rất thú vị.'],
    '右':['向右看。','Xiàng yòu kàn.','Nhìn sang bên phải.'],
    '右边':['我坐在他的右边。','Wǒ zuò zài tā de yòubian.','Tôi ngồi ở phía bên phải anh ấy.'],
    '鱼':['水里有很多鱼。','Shuǐ li yǒu hěn duō yú.','Trong nước có rất nhiều cá.'],
    '远':['我家离公司很远。','Wǒ jiā lí gōngsī hěn yuǎn.','Nhà tôi cách công ty rất xa.'],
    '运动':['多做运动对身体好。','Duō zuò yùndòng duì shēntǐ hǎo.','Vận động nhiều tốt cho sức khỏe.'],
    '站':['请在下一站下车。','Qǐng zài xià yí zhàn xiàchē.','Xin vui lòng xuống xe ở trạm tiếp theo.'],
    '丈夫':['她的丈夫是一名医生。','Tā de zhàngfu shì yì míng yīshēng.','Chồng của cô ấy là một bác sĩ.'],
    '这么':['这个问题怎么这么难？','Zhège wèntí zěnme zhème nán?','Câu hỏi này sao mà khó thế này?'],
    '这样':['这样做是对的。','Zhèyàng zuò shì duì de.','Làm như thế này là đúng rồi.'],
    '着':['门开着。','Mén kāizhe.','Cửa đang mở.'],
    '正':['我正要出门呢。','Wǒ zhèng yào chūmén ne.','Tôi đang định ra ngoài đây.'],
    '周':['我这周非常忙。','Wǒ zhè zhōu fēicháng máng.','Tuần này tôi cực kỳ bận.'],
    '准备':['我正在准备考试。','Wǒ zhèngzài zhǔnbèi kǎoshì.','Tôi đang chuẩn bị cho kỳ thi.'],
    '自己':['你要照顾好自己。','Nǐ yào zhàogù hǎo zìjǐ.','Bạn phải chăm sóc tốt cho bản thân.'],
    '走':['时间不早了，我们走吧。','Shíjiān bù zǎo le, wǒmen zǒu ba.','Thời gian không còn sớm nữa, chúng ta đi thôi.'],
    '走路':['我每天走路去上班。','Wǒ měitiān zǒulù qù shàngbān.','Mỗi ngày tôi đều đi bộ đi làm.'],
    '足球':['我不喜欢踢足球。','Wǒ bù xǐhuan tī zúqiú.','Tôi không thích đá bóng.'],
    '最':['我最喜欢吃的菜是北京烤鸭。','Wǒ zuì xǐhuan chī de cài shì Běijīng kǎoyā.','Món ăn tôi thích nhất là vịt quay Bắc Kinh.'],
    '左':['向左转。','Xiàng zuǒ zhuǎn.','Rẽ trái.'],
    '左边':['左边是我的朋友。','Zuǒbian shì wǒ de péngyou.','Phía bên trái là bạn của tôi.'],
    '北京烤鸭':['北京烤鸭非常有名。','Běijīng kǎoyā fēicháng yǒumíng.','Vịt quay Bắc Kinh rất nổi tiếng.'],
    '北京大学':['他在北京大学学习汉语。','Tā zài Běijīng Dàxué xuéxí Hànyǔ.','Anh ấy học tiếng Trung ở Đại học Bắc Kinh.'],
    '颐和园':['颐和园的风景很美。','Yíhé Yuán de fēngjǐng hěn měi.','Phong cảnh Di Hòa Viên rất đẹp。']
  };
  const enrich=w=>{const e=EXAMPLES[w.hanzi];return {...w,example:e?.[0]||`${w.hanzi}怎么用？`,examplePinyin:e?.[1]||'',exampleVi:e?.[2]||'Ví dụ đang được cập nhật.'};};
  const words=HSK2_VOCAB.map(enrich);
  const appView=()=>{const learned=Object.keys(saved).filter(k=>saved[k]).length;app.innerHTML=`<section class="page vocab-page"><div class="section-title"><span class="cn">HSK 2 词汇</span><span class="vi">Từ vựng HSK2 · ${total} mục</span></div><div class="vocab-toolbar"><a class="btn secondary" href="#review-hsk">← HSK</a><div class="vocab-progress">Đã đánh dấu học: <b>${learned}/${total}</b></div></div><div class="vocab-tabs"><button class="vocab-tab ${mode==='list'?'active':''}" data-mode="list">Danh sách</button><button class="vocab-tab ${mode==='study'?'active':''}" data-mode="study">Học từ</button><button class="vocab-tab ${mode==='quiz'?'active':''}" data-mode="quiz">Kiểm tra</button></div><div id="vocab-content"></div></section>`;document.querySelectorAll('.vocab-tab').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;if(mode==='quiz')startVocabQuiz();else renderVocabContent()});renderVocabContent()};
  function markLearned(id){saved[id]=true;localStorage.setItem('cobi_hsk2_vocab',JSON.stringify(saved));renderVocabContent()}
  function speak(text){if(!('speechSynthesis' in window))return toast('Trình duyệt này không hỗ trợ phát âm.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.82;speechSynthesis.speak(u)}
  function flipCard(){const c=document.getElementById('study-flip');if(c)c.classList.toggle('flipped')}
  function renderVocabContent(){const box=document.getElementById('vocab-content');if(!box)return;if(mode==='list'){box.innerHTML=`<div class="vocab-search-row"><input id="vocab-search" class="vocab-search" placeholder="Tìm chữ Hán, pinyin hoặc nghĩa tiếng Việt..."><span class="vocab-count">${total} từ</span></div><div class="vocab-table-wrap"><table class="vocab-table"><thead><tr><th>#</th><th>汉字</th><th>Pinyin</th><th>Nghĩa</th><th></th></tr></thead><tbody id="vocab-body"></tbody></table></div>`;const fill=()=>{const q=(document.getElementById('vocab-search').value||'').trim().toLowerCase();document.getElementById('vocab-body').innerHTML=words.filter(w=>!q||`${w.hanzi} ${w.pinyin} ${w.meaning}`.toLowerCase().includes(q)).map(w=>`<tr class="${saved[w.id]?'learned':''}"><td>${w.id}</td><td class="hanzi-cell">${esc(w.hanzi)}</td><td>${esc(w.pinyin)}</td><td>${esc(w.meaning)}</td><td><button class="icon-btn" data-speak="${esc(w.hanzi)}" title="Nghe">🔊</button></td></tr>`).join('');document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak))};document.getElementById('vocab-search').oninput=fill;fill();return}
    if(mode==='study'){const w=words[current];box.innerHTML=`<div class="study-wrap"><div class="study-index">${current+1} / ${total}</div><div id="study-flip" class="flip-card"><div class="flip-inner"><div class="flip-face flip-front"><div class="front-label">NHÌN CHỮ HÁN</div><div class="study-hanzi">${esc(w.hanzi)}</div><button class="speak-btn" id="speak-word">🔊 Nghe phát âm</button><div class="flip-hint">Nghe xong → chạm vào thẻ để lật</div></div><div class="flip-face flip-back"><div class="front-label">MẶT SAU</div><div class="study-hanzi small">${esc(w.hanzi)}</div><div class="study-pinyin">${esc(w.pinyin)}</div><div class="study-meaning">${esc(w.meaning)}</div><div class="example-box"><div class="example-label">CÂU VÍ DỤ</div><div class="example-cn">${esc(w.example)}</div>${w.examplePinyin?`<div class="example-pinyin">${esc(w.examplePinyin)}</div>`:''}<div class="example-vi">${esc(w.exampleVi)}</div><button class="speak-example" id="speak-example">🔊 Nghe câu ví dụ</button></div></div></div></div><button class="flip-button" id="flip-btn">↻ Lật thẻ</button><div class="study-actions"><button class="btn secondary" id="prev-word" ${current===0?'disabled':''}>← Từ trước</button><button class="btn red" id="learn-word">${saved[w.id]?'✓ Đã học':'Đánh dấu đã học'}</button><button class="btn secondary" id="next-word">Từ tiếp →</button></div></div>`;document.getElementById('study-flip').onclick=flipCard;document.getElementById('flip-btn').onclick=flipCard;document.getElementById('speak-word').onclick=e=>{e.stopPropagation();speak(w.hanzi)};document.getElementById('speak-example').onclick=e=>{e.stopPropagation();speak(w.example)};document.getElementById('prev-word').onclick=()=>{current=Math.max(0,current-1);renderVocabContent()};document.getElementById('next-word').onclick=()=>{current=(current+1)%total;renderVocabContent()};document.getElementById('learn-word').onclick=()=>markLearned(w.id);return}
    if(mode==='quiz')renderQuizContent();
  }
  function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
  function startVocabQuiz(){quiz=shuffle(words).slice(0,10);quizIndex=0;quizScore=0;quizType=shuffle(['meaning','pinyin','hanzi','match'])[0];renderVocabContent()}
  function nextQuiz(){quizIndex++;if(quizIndex<quiz.length){quizType=shuffle(['meaning','pinyin','hanzi','match'])[0];renderVocabContent()}else renderVocabContent()}
  function renderQuizContent(){const box=document.getElementById('vocab-content');if(!quiz.length){startVocabQuiz();return}if(quizIndex>=quiz.length){box.innerHTML=`<div class="quiz-result"><div class="quiz-score">${quizScore}/${quiz.length}</div><h3>Hoàn thành lượt ôn HSK2</h3><p>Mỗi lượt gồm 10 từ được chọn ngẫu nhiên từ toàn bộ danh sách ${total} từ.</p><button class="btn red" id="quiz-again">Làm lượt mới</button></div>`;document.getElementById('quiz-again').onclick=startVocabQuiz;return}const w=quiz[quizIndex];const candidates=shuffle([w,...shuffle(words.filter(x=>x.id!==w.id)).slice(0,3)]);let title='',prompt='',body='';
    if(quizType==='meaning'){title='Hán tự → Nghĩa';prompt=`<div class="quiz-prompt">${esc(w.hanzi)} <button class="icon-btn" id="quiz-speak">🔊</button></div><p class="quiz-sub">Chọn nghĩa đúng của từ.</p>`;body=candidates.map((x,i)=>`<button class="quiz-option" data-answer="${x.id}">${String.fromCharCode(65+i)}. ${esc(x.meaning)}</button>`).join('')}
    if(quizType==='pinyin'){title='Hán tự → Pinyin';prompt=`<div class="quiz-prompt">${esc(w.hanzi)} <button class="icon-btn" id="quiz-speak">🔊</button></div><p class="quiz-sub">Chọn pinyin đúng.</p>`;body=candidates.map((x,i)=>`<button class="quiz-option" data-answer="${x.id}">${String.fromCharCode(65+i)}. ${esc(x.pinyin)}</button>`).join('')}
    if(quizType==='hanzi'){title='Nghĩa → Hán tự';prompt=`<div class="quiz-prompt quiz-vietnamese">${esc(w.meaning)}</div><p class="quiz-sub">Chọn Hán tự đúng.</p>`;body=candidates.map((x,i)=>`<button class="quiz-option hanzi-option" data-answer="${x.id}">${String.fromCharCode(65+i)}. ${esc(x.hanzi)}</button>`).join('')}
    if(quizType==='match'){const pool=shuffle([w,...shuffle(words.filter(x=>x.id!==w.id)).slice(0,3)]);prompt=`<div class="quiz-prompt">${esc(w.hanzi)}</div><p class="quiz-sub">Chọn cặp <b>Hán tự – Pinyin</b> đúng.</p>`;body=pool.map((x,i)=>`<button class="quiz-option" data-answer="${x.id}">${String.fromCharCode(65+i)}. ${esc(x.hanzi)} — ${esc(x.pinyin)}</button>`).join('')}
    box.innerHTML=`<div class="quiz-card"><div class="quiz-meta"><span>Câu ${quizIndex+1}/10</span><b>${title}</b></div>${prompt}<div class="quiz-options">${body}</div></div>`;
    document.getElementById('quiz-speak')?.addEventListener('click',e=>{e.stopPropagation();speak(w.hanzi)});
    document.querySelectorAll('.quiz-option').forEach(b=>b.onclick=()=>{const ok=Number(b.dataset.answer)===w.id;if(ok)quizScore++;document.querySelectorAll('.quiz-option').forEach(x=>x.disabled=true);b.classList.add(ok?'correct':'wrong');if(!ok)document.querySelector(`.quiz-option[data-answer="${w.id}"]`)?.classList.add('correct');setTimeout(nextQuiz,550)});
  }
  appView();
}

function placeholder(t,d){app.innerHTML=`<section class="page"><div class="section-title"><span class="cn">${esc(t)}</span><span class="vi">${esc(d)}</span></div><div class="card"><div class="notice">Khu vực này đã được giữ sẵn trong hệ thống Thư Quán.</div></div></section>`}
function renderHome(){app.innerHTML=`<section class="page hero"><div><div class="hero-kicker">漢 · 書 · 語 · 學</div><h1><span class="hero-vn">Thư Quán Hán Ngữ</span> <span class="hero-cobi">CoBi</span></h1><h2>一朝入书馆，一生伴汉语</h2><p>Một ngày nhập Thư Quán, trọn đời hành Hán Ngữ.</p><div class="hero-ornament">— ❖ —</div></div></section><section class="page" style="padding-top:0"><div class="section-title"><span class="cn">入馆三卷</span><span class="vi">Ba không gian học tập của Thư Quán</span></div><div class="card-grid"><a class="card menu-card" href="#knowledge"><div class="symbol">知</div><h3>Kiến Thức</h3><p>Từ vựng, ngữ pháp, cấu trúc câu.</p></a><a class="card menu-card" href="#review"><div class="symbol">习</div><h3>Ôn tập</h3><p>Ôn lại kiến thức theo trình độ.</p></a><a class="card menu-card" href="#practice"><div class="symbol">试</div><h3>Luyện đề</h3><p>Luyện đề HSK1–HSK6.</p></a></div></section>`}
function renderPracticeHome(){app.innerHTML=`<section class="page"><div class="section-title"><span class="cn">HSK4 模拟考试</span><span class="vi">Luyện đề HSK4 · 第01套</span></div><div class="notice"><strong>听力:</strong> thời gian đúng bằng độ dài audio. <strong>阅读:</strong> 40 phút. <strong>书写:</strong> 25 phút. <strong>检查:</strong> 5 phút.</div><div class="card-grid"><div class="card"><h3>听力 · 45题</h3><p>判断正误 + ABCD.</p></div><div class="card"><h3>阅读 · 40题</h3><p>选词填空 + 排列顺序 + 阅读理解.</p></div><div class="card"><h3>书写 · 15题</h3><p>86–95 tự chấm; 96–100 giáo viên chấm.</p></div></div><div class="card start-card"><label><strong>姓名 · Họ tên học viên</strong></label><input id="student-name" placeholder="Nhập họ tên"><button class="btn red" id="start-exam">开始考试 · Bắt đầu</button></div></section>`;document.getElementById('start-exam').onclick=startExam}
function allQuestions(){return [...EXAM.data.listening,...EXAM.data.reading,...EXAM.data.writingOrder,...EXAM.data.writingPicture]}
function sectionQuestions(section){if(section==='listening')return EXAM.data.listening;if(section==='reading')return EXAM.data.reading;if(section==='writing')return [...EXAM.data.writingOrder,...EXAM.data.writingPicture];return allQuestions()}
function questionSection(id){if(id<=45)return'listening';if(id<=85)return'reading';return'writing'}
function isDone(q){return EXAM.answers[q.id]!==undefined&&String(EXAM.answers[q.id]).trim()!==''}
function startExam(){let n=document.getElementById('student-name').value.trim();if(!n)return toast('Vui lòng nhập họ tên học viên.');EXAM.studentName=n;EXAM.answers={};EXAM.submitted=false;EXAM.section='listening';renderListening()}
function clearTimers(){clearInterval(EXAM.timer);clearInterval(EXAM.audioTimer);EXAM.timer=null;EXAM.audioTimer=null}
function startClock(seconds,onEnd){setPhaseTimer(seconds,onEnd)}
function startAudioClock(){clearInterval(EXAM.audioTimer);EXAM.audioTimer=setInterval(()=>{if(EXAM.audio&&!EXAM.audio.paused&&isFinite(EXAM.audio.duration)){EXAM.remaining=Math.max(0,Math.ceil(EXAM.audio.duration-EXAM.audio.currentTime));paintTimer()}},250)}
function paintTimer(){let e=document.getElementById('timer');if(!e)return;let s=Math.max(0,EXAM.remaining),m=Math.floor(s/60),r=s%60;e.textContent=`${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;e.classList.toggle('warning',s<=60)}
function shell(title,sub,qs){app.innerHTML=`<div class="practice-shell"><div class="practice-top"><div class="practice-top-row"><div><div class="exam-title">${esc(EXAM.data.meta.title)}</div><div class="subhead">${esc(title)} · ${esc(sub)}</div></div><div class="timer" id="timer">00:00</div></div><div class="progress-line"><div class="progress-fill" id="progress-fill"></div></div></div><div class="exam-layout"><main class="exam-main" id="exam-main"></main><aside class="reading-nav"><h3>答题卡</h3><div class="legend"><span class="dot green"></span> Đã làm <span class="dot red"></span> Chưa làm</div><div class="palette" id="palette"></div></aside></div></div>`;renderPalette();updateProgress()}
function renderListening(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='listening'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 听力':'听力','Nghe'+(reviewMode?' · Rà soát':' · Audio'),EXAM.data.listening);
  const main=document.getElementById('exam-main');
  if(!reviewMode){
    const audio=document.createElement('audio'); audio.id='listening-audio'; audio.src=EXAM.data.meta.listeningAudio; audio.preload='metadata'; audio.controls=false; audio.style.display='none';
    audio.addEventListener('loadedmetadata',()=>{if(isFinite(audio.duration)&&audio.duration>0){EXAM.remaining=Math.ceil(audio.duration);paintTimer();startAudioClock()}});
    audio.addEventListener('timeupdate',()=>{if(isFinite(audio.duration)&&audio.duration>0){EXAM.remaining=Math.max(0,Math.ceil(audio.duration-audio.currentTime));paintTimer()}});
    audio.addEventListener('ended',endListening);
    audio.addEventListener('error',()=>toast('Không đọc được audio. Kiểm tra file audio/hsk4/test01.mp3.'));
    main.appendChild(audio); EXAM.audio=audio; audio.play().catch(()=>toast('Nếu trình duyệt chặn tự phát audio, hãy cho phép âm thanh rồi mở lại bài.'));
  }
  EXAM.data.listening.forEach(q=>main.appendChild(questionElement(q)));
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-section">下一部分 → Sang 阅读</button></div>`);
    document.getElementById('next-section').onclick=endListening;
  }
  renderPalette(); updateProgress();
  if(!reviewMode) setTimeout(()=>{if(EXAM.audio&&isFinite(EXAM.audio.duration)&&EXAM.audio.duration>0)startAudioClock()},500);
}
function endListening(){if(EXAM.section!=='listening')return;clearTimers();if(EXAM.audio){EXAM.audio.pause();EXAM.audio.currentTime=0}EXAM.audio=null;renderReading()}
function renderReading(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='reading'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 阅读':'阅读','Đọc · '+(reviewMode?'Rà soát':'40 phút'),EXAM.data.reading);
  const main=document.getElementById('exam-main');
  const groups=[['第一部分 · 选词填空',EXAM.data.reading.filter(q=>q.id<=55)],['第二部分 · 排列顺序',EXAM.data.reading.filter(q=>q.id>=56&&q.id<=65)],['第三部分 · 阅读理解',EXAM.data.reading.filter(q=>q.id>=66)]];
  groups.forEach(([title,qs])=>{main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>${esc(title)}</span></div>`);qs.forEach(q=>main.appendChild(questionElement(q)))});
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-writing">下一部分 → Sang 书写</button></div>`);
    document.getElementById('next-writing').onclick=()=>renderWriting(false);
    setPhaseTimer(40*60,()=>renderWriting(false));
  }
  renderPalette(); updateProgress();
}
function renderWriting(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='writing'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 书写':'书写','Viết · '+(reviewMode?'Rà soát':'25 phút'),sectionQuestions('writing'));
  const main=document.getElementById('exam-main');
  main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>第一部分 · 完成句子</span></div>`);
  EXAM.data.writingOrder.forEach(q=>main.appendChild(questionElement(q)));
  main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>第二部分 · 看图，用词造句</span></div><div class="shared-writing-image"><img src="${esc(EXAM.data.meta.writingPicture)}" alt="HSK4 96–100"><p>第96–100题共用此图</p></div>`);
  EXAM.data.writingPicture.forEach(q=>main.appendChild(questionElement(q)));
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-review">检查答案 → 进入 5 分钟 rà soát</button></div>`);
    document.getElementById('next-review').onclick=startReview;
    setPhaseTimer(25*60,startReview);
  }
  renderPalette(); updateProgress();
}
function startReview(){
  if(EXAM.section==='review')return;
  goTop();
  clearTimers();
  if(EXAM.audio)EXAM.audio.pause();
  EXAM.audio=null; EXAM.section='review'; EXAM.reviewMode=false;
  EXAM.reviewDeadline=Date.now()+EXAM.data.meta.reviewMinutes*60*1000;
  renderReview();
}
function questionElement(q){const c=document.createElement('article');c.className='question-card';c.id='q-'+q.id;let body='';if(q.type==='tf'){body=`<div class="statement">★ ${esc(q.statement)}</div>${options(q,q.options)}`}else if(q.type==='mcq'){body=options(q,q.options)}else if(q.type==='cloze'){body=(q.example?`<div class="example"><strong>例如：</strong>${esc(q.example)}</div>`:'')+`<div class="cloze-text">${esc(q.question)}</div>${options(q,q.options)}`}else if(q.type==='order'){const keys=Array.isArray(q.parts)?q.parts.map((_,i)=>String.fromCharCode(65+i)):Object.keys(q.parts);const labels=Array.isArray(q.parts)?q.parts:Object.values(q.parts);const saved=String(EXAM.answers[q.id]||'').split('').filter(Boolean);const ordered=saved.length?saved:keys;body=`<div class="order-parts">${labels.map((v,i)=>`<div class="order-part"><b>${keys[i]}</b><span>${esc(v)}</span></div>`).join('')}</div><p class="drag-hint">拖动下方字母排列顺序 · Có thể kéo thả hoặc bấm để đổi vị trí</p><div class="order-builder" data-order="${q.id}">${ordered.map(k=>`<button type="button" class="order-token" draggable="true" data-token="${k}">${k}</button>`).join('')}</div><input type="hidden" class="answer-input" data-answer="${q.id}" value="${esc(ordered.join(''))}">`}else if(q.type==='reading'){body=`<div class="passage">${esc(q.passage)}</div><div class="question-text">${esc(q.question)}</div>${options(q,q.options)}`}else if(q.type==='picture'){body=`<div class="picture-instruction">看图，用词“<strong>${esc(q.word)}</strong>”造句</div><input class="answer-input picture-answer" data-answer="${q.id}" value="${esc(EXAM.answers[q.id]||'')}" placeholder="请输入句子">`};c.innerHTML=`<div class="q-head"><span class="q-number">第 ${q.id} 题</span><span class="q-type">${typeName(q.type)}</span></div>${body}`;c.querySelectorAll('input[type=radio]').forEach(r=>r.onchange=()=>setAnswer(q.id,r.value));c.querySelectorAll('.answer-input:not([type=hidden])').forEach(i=>i.oninput=()=>setAnswer(q.id,i.value));const builder=c.querySelector('.order-builder');if(builder){let dragged=null;const sync=()=>{const order=[...builder.querySelectorAll('.order-token')].map(b=>b.dataset.token).join('');const input=c.querySelector('.answer-input');input.value=order;setAnswer(q.id,order)};builder.querySelectorAll('.order-token').forEach(btn=>{btn.addEventListener('dragstart',e=>{dragged=btn;btn.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',btn.dataset.token)});btn.addEventListener('dragend',()=>{dragged=null;btn.classList.remove('dragging');builder.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});btn.addEventListener('dragover',e=>{e.preventDefault();btn.classList.add('drag-over');e.dataTransfer.dropEffect='move'});btn.addEventListener('dragleave',()=>btn.classList.remove('drag-over'));btn.addEventListener('drop',e=>{e.preventDefault();btn.classList.remove('drag-over');if(!dragged||dragged===btn)return;const rect=btn.getBoundingClientRect();builder.insertBefore(dragged,e.clientX>rect.left+rect.width/2?btn.nextSibling:btn);sync()});btn.addEventListener('click',()=>{const arr=[...builder.querySelectorAll('.order-token')];const idx=arr.indexOf(btn);if(idx>0){builder.insertBefore(btn,arr[idx-1]);sync()}else if(arr.length>1){builder.appendChild(btn);sync()}})})}return c}
function typeName(t){return({tf:'判断正误',mcq:'选择题',cloze:'选词填空',reading:'阅读理解',order:'排列顺序',picture:'看图写句'})[t]||''}
function options(q,o){return `<div class="options">${Object.entries(o).map(([k,v])=>`<label class="option"><input type="radio" name="q-${q.id}" value="${k}" ${EXAM.answers[q.id]===k?'checked':''}><span><b>${k}.</b> ${esc(v)}</span></label>`).join('')}</div>`}
function setAnswer(id,v){EXAM.answers[id]=v;renderPalette();updateProgress()}
function renderPalette(){let e=document.getElementById('palette');if(!e)return;let qs=sectionQuestions(EXAM.section);e.innerHTML=qs.map(q=>`<button class="${isDone(q)?'done':''}" data-jump="${q.id}">${q.id}</button>`).join('');e.querySelectorAll('button').forEach(b=>b.onclick=()=>jumpToQuestion(Number(b.dataset.jump)))}
function jumpToQuestion(id){
  const sec=questionSection(id);
  if(EXAM.section===sec && !EXAM.reviewMode){document.getElementById('q-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(EXAM.section!=='review'){toast('Câu này thuộc phần khác.');return;}
  if(Date.now()>=EXAM.reviewDeadline){submitExam();return;}
  if(sec==='listening')renderListening(true);else if(sec==='reading')renderReading(true);else renderWriting(true);
  setTimeout(()=>document.getElementById('q-'+id)?.scrollIntoView({behavior:'auto',block:'start'}),80);
}
function updateProgress(){let e=document.getElementById('progress-fill');if(!e)return;let qs=sectionQuestions(EXAM.section);e.style.width=qs.length?`${qs.filter(isDone).length/qs.length*100}%`:'0%'}
function renderReview(){
  clearTimers();
  goTop();
  EXAM.section='review'; EXAM.reviewMode=false;
  let qs=allQuestions(),un=qs.filter(q=>!isDone(q));
  app.innerHTML=`<section class="page"><div class="review-top"><div class="section-title"><span class="cn">检查答案</span><span class="vi">Rà soát · còn ${un.length} câu chưa làm</span></div><div class="review-timer" id="review-timer">05:00</div></div><div class="card"><p><b class="green-text">Xanh</b> = đã làm · <b class="red-text">Đỏ</b> = chưa làm. Bấm số câu để xem và sửa đáp án.</p><div class="palette review-palette">${qs.map(q=>`<button class="${isDone(q)?'done':''}" data-jump="${q.id}">${q.id}</button>`).join('')}</div></div><div class="card"><button class="btn red" id="submit-now">提交答案 · Nộp bài ngay</button></div></section>`;
  document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jumpToQuestion(Number(b.dataset.jump)));
  document.getElementById('submit-now').onclick=submitExam;
  EXAM.remaining=Math.max(0,Math.ceil((EXAM.reviewDeadline-Date.now())/1000));
  paintReviewTimer();
  EXAM.timer=setInterval(()=>{EXAM.remaining=Math.max(0,Math.ceil((EXAM.reviewDeadline-Date.now())/1000));paintReviewTimer();if(EXAM.remaining<=0){clearTimers();submitExam()}},200);
}
function paintReviewTimer(){const el=document.getElementById('review-timer');if(el){el.textContent=formatTime(EXAM.remaining);el.classList.toggle('warning',EXAM.remaining<=60)}}
function formatTime(s){s=Math.max(0,Math.ceil(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function submitExam(){if(EXAM.submitted)return;EXAM.submitted=true;clearTimers();if(EXAM.audio)EXAM.audio.pause();let r=calculateResult();saveResultLocally(r);renderResult(r);sendResultToGoogleSheets(r)}
function calculateResult(){let l=EXAM.data.listening,r=EXAM.data.reading,w=EXAM.data.writingOrder,p=EXAM.data.writingPicture;let lc=l.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length,rc=r.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length,wc=w.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length;let wrong=[...l,...r,...w].filter(q=>q.answer&&norm(EXAM.answers[q.id])!==norm(q.answer)).map(q=>({id:q.id,student:EXAM.answers[q.id]||'',correct:q.answer}));return{examId:EXAM.data.meta.title,level:EXAM.data.meta.level,studentName:EXAM.studentName,submittedAt:new Date().toISOString(),listeningCorrect:lc,listeningTotal:l.length,readingCorrect:rc,readingTotal:r.length,writingOrderCorrect:wc,writingOrderTotal:w.length,pictureAnswered:p.filter(isDone).length,pictureTotal:p.length,autoScore:+(lc*2.22+rc*2.5+wc*6).toFixed(2),wrong,answers:{...EXAM.answers}}}
function renderResult(r){app.innerHTML=`<section class="page"><div class="result-box"><div class="section-title"><span class="cn">考试结果</span><span class="vi">Kết quả luyện đề</span></div><div class="score-big">${r.autoScore}</div><p class="result-note">Học viên: <b>${esc(r.studentName)}</b><br>Điểm tự động, chưa gồm điểm 96–100 do giáo viên chấm.</p><table class="score-table"><tr><th>Phần</th><th>Đúng</th><th>Điểm</th></tr><tr><td>Nghe</td><td>${r.listeningCorrect}/${r.listeningTotal}</td><td>${(r.listeningCorrect*2.22).toFixed(2)}</td></tr><tr><td>Đọc</td><td>${r.readingCorrect}/${r.readingTotal}</td><td>${(r.readingCorrect*2.5).toFixed(2)}</td></tr><tr><td>Viết 86–95</td><td>${r.writingOrderCorrect}/${r.writingOrderTotal}</td><td>${(r.writingOrderCorrect*6).toFixed(2)}</td></tr><tr><td>Viết 96–100</td><td>${r.pictureAnswered}/${r.pictureTotal}</td><td>GV chấm</td></tr></table><h3>Câu sai / chưa làm</h3><div class="wrong-list">${r.wrong.length?r.wrong.map(w=>`<div class="wrong-item"><b>Câu ${w.id}</b> · Bạn: <code>${esc(w.student||'Chưa làm')}</code> · Đáp án: <code>${esc(w.correct)}</code></div>`).join(''):'Không có câu sai ở phần tự chấm.'}</div><div class="notice">${GOOGLE_SHEETS_WEB_APP_URL?'Kết quả đã được gửi lên Google Sheets.':''}</div><a class="btn secondary" href="#practice">Làm lại</a></div></section>`}
const GOOGLE_SHEETS_WEB_APP_URL=''; // Dán Web App URL của Google Apps Script vào đây sau khi triển khai
function saveResultLocally(r){try{const key='cobi_hsk_results';const old=JSON.parse(localStorage.getItem(key)||'[]');old.push(r);localStorage.setItem(key,JSON.stringify(old));}catch(e){console.warn('Không lưu được localStorage',e)}}
function sendResultToGoogleSheets(r){if(!GOOGLE_SHEETS_WEB_APP_URL)return;const payload={...r,answers:JSON.stringify(r.answers),wrong:JSON.stringify(r.wrong)};fetch(GOOGLE_SHEETS_WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).then(()=>toast('Đã gửi kết quả lên Google Sheets.')).catch(()=>toast('Không gửi được Google Sheets; kết quả vẫn được lưu trên máy.'))}
window.addEventListener('hashchange',route);route();
