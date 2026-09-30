# GLM_5.3_🆚_Kimi_K3：一手后端深度实测

- **笔记 ID**：6a8118ae0000000032022a6f
- **原文链接**：https://www.xiaohongshu.com/explore/6a8118ae0000000032022a6f
- **图片数量**：12 张
- **提取方式**：RapidOCR 本地离线识别（平均置信度 0.862）
- **正文字数**：约 5271 字

---

## 正文

发布于上海最近我开始好奇一件事：

现在的模型基本都能写后端代码了，它们之间真正的差别，到底还剩什么？

这次，我把GLM5.3和KimiK3分别接入ClaudeCode，让它们在相同环境中完成库存扣减订单分页、第三方服务调用和大文件导出四个任务

我们先说结论：KimiK3更快给出可运行版本，适合验证想法和制作原型。GLM5.3在四项测试中都表现出了更强的工程意识，更常主动检查并发重试、失败回滚和后续维护。如果把场景放到对稳定性要求更高的后端任务里，这轮测试中GLM53给我的整体印象会更好一些

### 1.第一项测试库存扣减

常见的错误写法，是先查库存，再判断够不够，最后执行扣减。两个请求同时进来时，可能都看到"还有1件”，随后各自扣掉1件

两款模型都避开了这个问题。它们把库存判断和扣减交给数据库一次完成，只有库存足够时才更新#摄型GLM5.3#功能：使用一条条件UPDATE完成“到断库存+扣减库存”#优点：避免“先查询、再断，后更新“的竞态条性；并发请求由敏据库行事行化_atomic(, sku_id:int,)->int:stmt=（update(Inventory)where(Inventory.sku_id =sku_idInventory.available>=quantity，#库存不是时不么更新压何行values(available=Inventory.=Inventory.reserved +=Inventory.version + l

result =.execute(stmt).rowcount

接下来还要处理重复请求。用户连点两次、网络超时后自动重试，都可能让同一个订单被执行多次

两个模型都考虑了幂等处理。KimiK3把校验、扣库存和结果回放集中在一个入口里，代码路径更短

适合快速跑通和复制验证#校：KimiK3#功信：在个人口中集十此，曾整抢占，情更朗和前应同政def deduct_stock(,)=_request_fingerprint(req).= session.execute(select():where(.user_id- req.user_.key ss req.request_id).scalar_one_or_none)_replay_response(existing,reg)

withsession.begin_.add(_id=req.user_idkey=req.request_idrequest_payload=_payload-"O"

港恢于条件更额：库存不定时rowcount为0result = session.execute(update(Product)where(Product.id ==req.product_id, Product,stock >req.quantity)values(stock=Product.stock-req.quantity)if result.rowcount =("")GLM5.3把幂等查询、库存扣减和流水写入放进同一事务。重复请求会直接返回之前的结果，其中任何一步失败，整笔操作都会回滚。它还设计了200个并发请求争抢100份库存的测试。从实现到测试，GLM5.3对生产环境常见问题的覆盖会更完整一些

#填型：GLM5.3共功能：特幕需重询、扣库存、水写入放进同一个事务#优点：复请求不会重复扣减；任一步失收都会国录，遵免库存和而水不一致(seif,idempotency_key: str,).session_.=.scalar(select()where(.idempotency_key=idempotency_key)with_for_updateO

._ensure_same_request(existing,request)._replay(existing, session)

affected=_atomic(session,request.sku_id,request.quantity)_exists(session, request.sku_id)(ErrorCode.SKU_NoT_FouND)(ErrorCode.SToCK_NoT_ENoUGH)

session.add(_key=idempotency_keyuser_id=request.user_idsku_id=request.sku_idquantity=request."suCCESs"库存不能减成负数，同一个订单也不能重复扣库存这是两层风险，GLM5.3对两层风险都给出了完整保护，对线上场景的边界考虑得更细

### 2.第二项测试订单分页

KimiK3的查询和翻页逻辑比较直接，代码短，修改起来也快

#良量：Kimi k3优惠：缩鸭量单、作限小底，后合快遭微川可中慢白def nist_orders(,= 0,= 20).execute(select(order,User.name.labelc"user_name"))join(User, User.id order.user_id)order_by(order.created_at.desc(,order.id.descO)offset(offset)Timit(limit)).a110GLM5.3除了按创建时间排序，还追加了订单ID并让游标同时记录时间和ID。这个改动直接决定了分页功能在真实数据量下是否可靠#快：GLM5:3#功：订与用，#诞间createdat+id&手股御序#A：created_at 和同时一上显id 匠，量见显更儿麦以质通query=(select(order'.idorder.order_noorder,statusOrder.amountOrder.created_atUser.name.label("user_name")-join(user, User,id m= order.user_id)where(User.deleted_at,is_(None))order_by(order.created_at.descO,order.id.descO)limit(page_size)

= query.wheretuple_(_at,order.id) tuple_(_at, cursor:id)如果一秒内创建了很多订单，只按时间排序，这些订单之间没有固定先后顺序。用户连续翻页时，可能看到重复订单，也可能漏掉订单。加入唯一的订单ID后，顺序才真正稳定

GLM5.3还提醒了模糊搜索在大数据量下的性能问题

订单少时，这些细节几乎没有存在感

数据涨到几十万甚至几百万条时，GLM5.3提前处理的这些问题，往往就是系统能否稳定扩展的分界线

它交付了当前可用的代码，也为未来的数据增长留出了空间

### 3.第三项测试ToolUse的工程边界：外部服务失败后，模型会不会盲目重试

KimiK3很快搭好超时、重试、限流和失败降级等保护措施，适合迅速建立一个完整框架

### #园Kimik3

():def _init_(seif,):se1f.client=httpx.Asyncclient(base_ur1=settings,weather_api_base_urltimeout=httpx.Timeout(connect=2.0read=5.0write=5.0poo1=5,0

_weather(seTf,city:str)->("/current",params=("city": cityi)ifresponse.status_,425,.status_code>=(""retryable=Truestatus_code=response.status_.status_code >=400

("upstream (",retryable=False),from_payload(response.jsonO)GLM5.3先判断这次请求能不能重试

查询天气或订单状态失败，通常可以再次请求

支付、下单和扣库存遇到超时，服务端可能已经执行成功，只是客户端没有及时收到结果

此时再次请求，就可能重复扣款或重复下单

### #GLM5.3

def can_retry(method: str,,idempotency_) ">bool:

if method._(idempotency_key)

_with_retry(client,method: str,url: str,$*kwargs)_key =kwargs.get("headers", ().get("")retry_aliowed = can_retry(method,idempotency_key=idempotency_key)(4)=.request(method, url, **kwargs)if response.status_code <_(httpx.,httpx.)_.sleep(min(0.5*(2attempt),4.0))

("",retryable=False)KimiK3提供的工具更多，GLM5.3对工具的使用边界判断得更谨慎。涉及支付和订单时，判断什么情况可以重试，比单纯增加保护组件更重要。在这一项上，GLM5.3对业务风险的处理会更细一些

### 4.第四项测试大文件导出

KimiK3把任务状态、并发数量限制、临时文件清理和表格安全处理集中在一个文件里。启动快，验证成本也低

#模型：KimiK3带功怕，行房肤各、迎程池、取同情正、CSV安和时文件清理能以现优点：依娱少、肩动快，适合快重输重异导川功能_init_(seif, max_= s. queue_size: int = 1oo):se1f.pool =(max_workers#max_workers)self.slots = asyncio.Semaphore(max_workers + queue_size)(self,task_id: str,job):awaitseif.sots.acquire以时k，J版必F%try:Toop=asyncio-get_running_.run_in_executor(seif.pool,job).slots.release()

def safe_csv_cell() -> str:text = str(value)if'text,"=","+","-","@"""t","Wr")):return"i"+.3继续处理分批读取、数据库连接释放任务取消和失败清理，并区分了基础测试、接口测试和压力测试

它把导出功能、资源管理和失败处理都补齐了，方案的完整度明显更高

### #模啦：GLM5.3

#低息：适合大致据量、长任务间生产环现，通免内准增长与临时文件津润def write_export(session,output_path: str,)(output_path,"w",newTine="",encoding="utf-8-sig")=csv.writer(file)writer.writerow(["onder_id","amount","creared_at")result=session,execute(build_order_queryO).partitions(1000)：#排1000行，心-次柜加载个表if task.status ==..writerow[csv_safe(row,order_id)csv_safe(row.amount)csv_safe(row.created_at)J)session.expire_al10

task.status =...status =.FAILEDtask.error=".close()这些细节最终会影响用户体验：同时导出的人多了页面会不会卡住；取消任务以后，服务器会不会继续占用资源；任务失败后，磁盘里会不会留下一堆临时文件

整体来看，KimiK3擅长快速铺开功能。GLM5.3在这轮测试里对工程细节的覆盖更完整，会主动寻找那些暂时看不见、上线后却可能造成损失的问题

并提前补上边界、测试和失败处理。前者更适合快速验证。进入正式项目和长期维护场景后，GLM53这种处理方式的优势会更明显

这轮对比也很像"后训练仙人"和ScalingLaw的一次交锋

KimiK3把参数规模推到了2.8T，走的是继续扩大模型规模的路线。GLM5.3沿用GLM5.2的基础模型，这一代的能力提升主要来自后训练

两条路线会相互叠加。KimiK3同样需要后训练GLM5.3也离不开足够强的基础模型。从这轮测试来看，我会更关注后训练这条路线在工程场景里的表现

因为后训练影响的，正是模型能不能把已有能力稳定地用在真实工作中

GLM5.3知道什么时候可以重试，什么时候必须停下，也会主动考虑生成的代码能不能放心上线能不能交给别人长期维护。在后端这个场景里，这种能力比单纯把代码写出来更有价值

---

## 逐图原文（按图片顺序，便于核对）

**图 1**

Memelnformation
26-8-1610:43
发布于上海
最近我开始好奇一件事：
现在的模型基本都能写后端代码了，它们之间真正
的差别，到底还剩什么？
这次，我把GLM5.3和KimiK3分别接入
ClaudeCode，让它们在相同环境中完成库存扣减
订单分页、第三方服务调用和大文件导出四个任务。
我们先说结论：KimiK3更快给出可运行版本，适
合验证想法和制作原型。GLM5.3在四项测试中
都表现出了更强的工程意识，更常主动检查并发、
重试、失败回滚和后续维护。如果把场景放到对稳
定性要求更高的后端任务里，这轮测试中GLM5.
3给我的整体印象会更好一些
1.第一项测试库存扣减。

**图 2**

Memelnformation
常见的错误写法，是先查库存，再判断够不够，最
后执行扣减。两个请求同时进来时，可能都看到
"还有1件”，随后各自扣掉1件。
两款模型都避开了这个问题。它们把库存判断和扣
减交给数据库一次完成，只有库存足够时才更新。
#摄型GLM5.3
#功能：使用一条条件UPDATE完成“到断库存+扣减库存”
#优点：避免“先查询、再断，后更新“的竞态条性；并发请求由敏据库行事行化。
async def deduct_atomic(session:Asyncsession, sku_id:int,quantity:int)->int:
stmt=（
update(Inventory)
.where(
Inventory.sku_id =sku_id,
Inventory.available>=quantity，#库存不是时不么更新压何行
.values(
available=Inventory.available-quantity,
reserved=Inventory.reserved + quantity,
version=Inventory.version + l,
result = await session.execute(stmt)
return result.rowcount
接下来还要处理重复请求。用户连点两次、网络超
时后自动重试，都可能让同一个订单被执行多次。
两个模型都考虑了幂等处理。KimiK3把校验、扣
库存和结果回放集中在一个入口里，代码路径更短

**图 3**

Memelnformation
适合快速跑通和复制验证
#校：KimiK3
#功信：在个人口中集十此，曾整抢占，情更朗和前应同政
def deduct_stock(session: Session, reg: DeductstockRequest):
fingerprint =_request_fingerprint(req)
with session.beginO:
existing = session.execute(
select(rdempotencyKey):where(
IdempotencyKey.user_id- req.user_id,
IdempotencyKey.key ss req.request_id,
).scalar_one_or_none)
if existing is not None:
return_replay_response(existing,reg)
withsession.begin_nestedO:
session.add(Idempotencykey
user_id=req.user_id,
key=req.request_id,
request_payload=fingerprint,
response_payload-"O",
港恢于条件更额：库存不定时rowcount为0
result = session.execute(
update(Product)
.where(Product.id ==req.product_id, Product,stock >req.quantity)
values(stock=Product.stock-req.quantity)
if result.rowcount = o:
raise Insufficientstockexception("insufficient stock")
GLM5.3把幂等查询、库存扣减和流水写入放进
同一事务。重复请求会直接返回之前的结果，其中
任何一步失败，整笔操作都会回滚。它还设计了
200个并发请求争抢100份库存的测试。从实现
到测试，GLM5.3对生产环境常见问题的覆盖会
更完整一些。

**图 4**

Memelnformation
#填型：GLM5.3
共功能：特幕需重询、扣库存、水写入放进同一个事务
#优点：复请求不会重复扣减；任一步失收都会国录，遵免库存和而水不一致
async def deduct(seif,idempotency_key: str,request: DeductstockRequest):
async with self.session_factoryO as session:
async with session.beginO:
existing=await session.scalar(
select(stockDeduction)
.where(stockDeduction.idempotency_key=idempotency_key)
.with_for_updateO
if existing is not None:
self._ensure_same_request(existing,request)
return await self._replay(existing, session)
affected=await deduct_atomic(session,request.sku_id,request.quantity)
if affectedo:
if not await sku_exists(session, request.sku_id):
raiseDomainError(ErrorCode.SKU_NoT_FouND)
raise DomainError(ErrorCode.SToCK_NoT_ENoUGH)
session.add(stockDeductionc
idempotency_key=idempotency_key,
user_id=request.user_id.
sku_id=request.sku_id,
quantity=request.quantity,
status-"suCCESs",
库存不能减成负数，同一个订单也不能重复扣库存。
这是两层风险，GLM5.3对两层风险都给出了完
整保护，对线上场景的边界考虑得更细。
2.第二项测试订单分页。
KimiK3的查询和翻页逻辑比较直接，代码短，修
改起来也快。

**图 5**

Memelnformation
#良量：Kimi k3
优惠：缩鸭量单、作限小底，后合快遭微川可中慢白。
def nist_orders(session: Session, offset: int = 0, 1imit: int = 20):
return session.execute(
select(order,User.name.labelc"user_name"))
.join(User, User.id  order.user_id)
.order_by(order.created_at.desc(,order.id.descO)
.offset(offset)
Timit(limit)
).a110
GLM5.3除了按创建时间排序，还追加了订单ID，
并让游标同时记录时间和ID。这个改动直接决定
了分页功能在真实数据量下是否可靠。
#快：GLM5:3
#功：订与用，#诞间createdat+id&手股御序，
#A：created_at 和同时一上显id 匠，量见显更儿麦以质通
query=(
select(
order'.id,
order.order_no,
order,status,
Order.amount,
Order.created_at,
User.name.label("user_name"),
-join(user, User,id m= order.user_id)
where(User.deleted_at,is_(None))
.order_by(order.created_at.descO,order.id.descO)
,limit(page_size)
if cursor is not None:
query = query.where
tuple_(order:created_at,order.id) tuple_(cursor:created_at, cursor:id)
如果一秒内创建了很多订单，只按时间排序，这些
订单之间没有固定先后顺序。用户连续翻页时，可
能看到重复订单，也可能漏掉订单。加入唯一的订
单ID后，顺序才真正稳定。

**图 6**

Memelnformation
GLM5.3还提醒了模糊搜索在大数据量下的性能
问题。
订单少时，这些细节几乎没有存在感
数据涨到几十万甚至几百万条时，GLM5.3提前
处理的这些问题，往往就是系统能否稳定扩展的分
界线。
它交付了当前可用的代码，也为未来的数据增长留
出了空间。
3.第三项测试ToolUse的工程边界：外部服务失
败后，模型会不会盲目重试。
KimiK3很快搭好超时、重试、限流和失败降级等
保护措施，适合迅速建立一个完整框架。

**图 7**

Memelnformation
#园Kimik3
class HTTPWeatherAPIClient(WeatherAPIClient):
def _init_(seif,settings: Settings):
se1f.client=httpx.Asyncclient(
base_ur1=settings,weather_api_base_url,
timeout=httpx.Timeout(
connect=2.0,
read=5.0.
write=5.0,
poo1=5,0,
async def get_weather(seTf,city:str)->weatherData;
responseawait seif:client:get("/current",params=("city": cityi)
ifresponse.status_code in t40s,425,429or response.status_code>=500:
raise UpstreamUnavailable(
"retryable upsuream failure",
retryable=True,
status_code=response.status_code,
if response.status_code >=400;
raise Upstreamunavailable("upstream (rejected request",retryable=False)
returnweatherData,from_payload(response.jsonO)
GLM5.3先判断这次请求能不能重试。
查询天气或订单状态失败，通常可以再次请求。
支付、下单和扣库存遇到超时，服务端可能已经执
行成功，只是客户端没有及时收到结果。
此时再次请求，就可能重复扣款或重复下单，

**图 8**

Memelnformation
#GLM5.3
def can_retry(method: str,,idempotency_key: str  None) ">bool:
if method.upperO in safe_methods:
return True
return bool(idempotency_key)
async def request_with_retry(client,method: str,url: str,$*kwargs):
idempotency_key =kwargs.get("headers", ().get("Idempotency-Key")
retry_aliowed = can_retry(method,idempotency_key=idempotency_key)
for attempt in range(4):
try:
response = await c1ient.request(method, url, **kwargs)
if response.status_code <5oo or not retry_allowed:
return response
except (httpx.TimeoutException,httpx.NetworkError):
if not retry_allowed:
raise
await asyncio.sleep(min(0.5*(2attempt),4.0))
raise upstreamUnavailable("retry budget exhausted",retryable=False)
KimiK3提供的工具更多，GLM5.3对工具的使用
边界判断得更谨慎。涉及支付和订单时，判断什么
情况可以重试，比单纯增加保护组件更重要。在这
一项上，GLM5.3对业务风险的处理会更细一些。
4.第四项测试大文件导出。
KimiK3把任务状态、并发数量限制、临时文件清
理和表格安全处理集中在一个文件里。启动快，验
证成本也低。

**图 9**

Memelnformation
#模型：KimiK3
带功怕，行房肤各、迎程池、取同情正、CSV安和时文件清理能以现
优点：依娱少、肩动快，适合快重输重异导川功能
cTass ExportExecutor:
def _init_(seif, max_workers: int = s. queue_size: int = 1oo):
se1f.pool =ThreadPoolExecutor(max_workers#max_workers)
self.slots = asyncio.Semaphore(max_workers + queue_size)
async def submit(self,task_id: str,job):
awaitseif.sots.acquire以时k，J版必F%
try:
Toop=asyncio-get_running_loopO
return await 1oop.run_in_executor(seif.pool,job)
finally:
se7f.slots.release()
def safe_csv_cell(value: object) -> str:
text = str(value)
if'text,startswithcc"=","+","-","@"""t","Wr")):
return"i"
+text
return text
GLM5.3继续处理分批读取、数据库连接释放、
任务取消和失败清理，并区分了基础测试、接口测
试和压力测试。
它把导出功能、资源管理和失败处理都补齐了，方
案的完整度明显更高。

**图 10**

Memelnformation
#模啦：GLM5.3
#低息：适合大致据量、长任务间生产环现，通免内准增长与临时文件津润，
def write_export(session,output_path: str,task: ExportTask):
try:
with open(output_path,"w",newTine="",encoding="utf-8-sig")as file:
writer =csv.writer(file)
writer.writerow(["onder_id","amount","creared_at")
result=session,execute(build_order_queryO)
forrowsinresuit.partitions(1000)：#排1000行，心-次柜加载个表
if task.status ==Exportstatus.CANCELLED:
return
for row in rows:
writer.writerow[
csv_safe(row,order_id),
csv_safe(row.amount),
csv_safe(row.created_at),
J)
session.expire_al10
task.status =.Exportstatus.succEss
exceptiException as exc;
task.status = Exportstatus.FAILED
task.error="export failed
raise
finally:
session.close()
这些细节最终会影响用户体验：同时导出的人多了
页面会不会卡住；取消任务以后，服务器会不会继
续占用资源；任务失败后，磁盘里会不会留下一堆
临时文件。
整体来看，KimiK3擅长快速铺开功能。GLM5.3
在这轮测试里对工程细节的覆盖更完整，会主动寻
找那些暂时看不见、上线后却可能造成损失的问题

**图 11**

Memelnformation
并提前补上边界、测试和失败处理。前者更适合快
速验证。进入正式项目和长期维护场景后，GLM5.
3这种处理方式的优势会更明显
这轮对比也很像"后训练仙人"和ScalingLaw的一
次交锋。
KimiK3把参数规模推到了2.8T，走的是继续扩
大模型规模的路线。GLM5.3沿用GLM5.2的基
础模型，这一代的能力提升主要来自后训练。
两条路线会相互叠加。KimiK3同样需要后训练
GLM5.3也离不开足够强的基础模型。从这轮测
试来看，我会更关注后训练这条路线在工程场景里
的表现。
因为后训练影响的，正是模型能不能把已有能力稳
定地用在真实工作中。

**图 12**

Memelnformation
GLM5.3知道什么时候可以重试，什么时候必须
停下，也会主动考虑生成的代码能不能放心上线、
能不能交给别人长期维护。在后端这个场景里，这
种能力比单纯把代码写出来更有价值..
