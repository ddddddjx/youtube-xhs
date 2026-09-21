#!/usr/bin/env python3
"""漫画讲解的固定 IP 与道具库（SVG 部件）。

角色局部坐标：头心 (0,0)，头半径 48，脚底 y≈195，整体高约 285；默认面朝右。
  ein      K 老师：爱因斯坦小人（灰色炸毛 + 灰胡子 + 吐舌头 + 黑外套黄领带），呼应账号头像
  xiaobai  小白：提问 / 踩坑的配角（三根呆毛 + 灰 T 恤）
  bot      方头机器人：代表 AI / Agent / 模型本身。accent=True 时系黄领带（用来区分「这期的主角模型」和普通大模型）
任何角色都可以戴 hat（PROPS 里的道具，戴在头顶）、头顶挂 meter（进度条），见 render_comic.py。
道具局部坐标：以 (0,0) 为中心、约 200x200 的范围。
"""

YELLOW, GREY, HAIR, RED, SHADOW = "#FFE600", "#CFCFCF", "#BDBDBD", "#FF5A5A", "#E3E3E3"

POSES = {  # 左臂, 右臂, 左腿, 右腿, 手里东西的位置
    "stand": ("M-12,70 L-30,112", "M12,70 L30,112", None, None, None),
    "wave":  ("M-12,70 L-46,92 L-42,58", "M12,70 L48,100", None, None, None),
    "point": ("M-12,70 L-30,112", "M12,68 L66,58", None, None, None),
    "shrug": ("M-14,72 L-44,84 L-52,62", "M14,72 L44,84 L52,62", None, None, None),
    "cheer": ("M-12,68 L-48,36", "M12,68 L48,36", None, None, None),
    "think": ("M-12,70 L-32,108 L-4,112", "M12,72 L38,96 L22,50", None, None, None),
    "hold":  ("M-12,70 L-30,112", "M12,70 L50,84", None, None, (58, 80)),
    "walk":  ("M-12,70 L-40,100", "M12,70 L42,96", "M-10,128 L-34,188", "M10,128 L34,186", None),
}
LEGS = ("M-12,128 L-14,190", "M12,128 L16,190")

EIN_FACES = {
    "tongue":   ('<circle cx="-16" cy="-8" r="5.5"/><circle cx="16" cy="-8" r="5.5"/>',
                 "M-27,-24 Q-16,-33 -6,-25 M6,-25 Q16,-33 27,-24", "tongue"),
    "happy":    ('<path d="M-24,-6 Q-16,-16 -8,-6 M8,-6 Q16,-16 24,-6" fill="none" stroke="#000" stroke-width="5"/>',
                 "M-27,-26 Q-16,-34 -6,-27 M6,-27 Q16,-34 27,-26", "tongue"),
    "smug":     ('<path d="M-26,-10 h18 a9,9 0 0 1 -18,0 Z M8,-10 h18 a9,9 0 0 1 -18,0 Z"/>',
                 "M-30,-22 L-6,-16 M4,-20 L30,-22", "side"),
    "surprise": ('<circle cx="-16" cy="-10" r="7.5"/><circle cx="16" cy="-10" r="7.5"/>',
                 "M-28,-32 Q-16,-40 -5,-32 M5,-32 Q16,-40 28,-32", "open"),
    "think":    ('<circle cx="-14" cy="-12" r="5"/><circle cx="18" cy="-12" r="5"/>',
                 "M-27,-24 L-6,-24 M6,-30 Q16,-38 27,-28", "none"),
    "sad":      ('<circle cx="-16" cy="-6" r="5"/><circle cx="16" cy="-6" r="5"/>',
                 "M-28,-18 L-8,-26 M8,-26 L28,-18", "frown"),
    # 无语 / 嫌弃：半闭的眼皮压着眼珠，一边眉毛挑起，嘴抿成一条线（封面默认表情）
    "meh":      ('<path d="M-27,-12 H-5 M5,-12 H27" fill="none" stroke="#000" stroke-width="6"/>'
                 '<path d="M-24,-12 a8,7 0 0 0 16,0 Z M8,-12 a8,7 0 0 0 16,0 Z"/>',
                 "M-28,-22 L-6,-20 M6,-26 Q18,-34 28,-26", "flat"),
}
XB_FACES = {
    "neutral":  ('<circle cx="-14" cy="-6" r="5"/><circle cx="16" cy="-6" r="5"/>', "", "M-6,18 L12,18"),
    "happy":    ('<circle cx="-14" cy="-6" r="5"/><circle cx="16" cy="-6" r="5"/>', "", "M-10,14 Q2,28 16,14"),
    "confused": ('<circle cx="-14" cy="-6" r="5"/><circle cx="16" cy="-6" r="5"/>',
                 "M-24,-22 L-6,-18 M8,-26 Q16,-32 26,-24", "M-6,20 Q2,14 12,20"),
    "surprise": ('<circle cx="-14" cy="-8" r="7"/><circle cx="16" cy="-8" r="7"/>',
                 "M-24,-28 Q-14,-34 -4,-28 M6,-28 Q16,-34 26,-28", "M-2,14 a6,8 0 1 0 12,0 a6,8 0 1 0 -12,0"),
    "sad":      ('<circle cx="-14" cy="-4" r="5"/><circle cx="16" cy="-4" r="5"/>',
                 "M-26,-16 L-6,-24 M8,-24 L28,-16", "M-8,22 Q2,12 14,22"),
    "smug":     ('<path d="M-24,-8 h18 a9,9 0 0 1 -18,0 Z M6,-8 h18 a9,9 0 0 1 -18,0 Z"/>',
                 "M-28,-20 L-4,-14 M4,-18 L28,-20", "M-4,18 Q6,24 14,14"),
    "meh":      ('<path d="M-25,-8 H-5 M5,-8 H25" fill="none" stroke="#000" stroke-width="6"/>'
                 '<path d="M-22,-8 a7,6 0 0 0 14,0 Z M8,-8 a7,6 0 0 0 14,0 Z"/>',
                 "M-24,-20 L-6,-18 M6,-24 Q16,-30 26,-22", "M-2,20 L12,19"),
}


def _limbs(pose):
    la, ra, ll, rl, hand = POSES.get(pose, POSES["stand"])
    ll, rl = ll or LEGS[0], rl or LEGS[1]
    fx1, fx2 = float(ll.split("L")[1].split(",")[0]), float(rl.split("L")[1].split(",")[0])
    return (f'<path d="{la} {ra}" fill="none" stroke="#000" stroke-width="9"/>'
            f'<path d="{ll} {rl}" fill="none" stroke="#000" stroke-width="10"/>'
            f'<ellipse cx="{fx1 - 6}" cy="191" rx="12" ry="7"/><ellipse cx="{fx2 + 6}" cy="191" rx="12" ry="7"/>'), hand


def einstein(pose="wave", face="tongue"):
    eyes, brows, mouth = EIN_FACES.get(face, EIN_FACES["tongue"])
    limbs, hand = _limbs(pose)
    m = {"tongue": f'<path d="M-8,20 L-8,36 Q0,47 8,36 L8,20 Z" fill="{RED}" stroke="#000" stroke-width="4"/>',
         "side": f'<path d="M2,20 L2,31 Q8,39 14,31 L14,20 Z" fill="{RED}" stroke="#000" stroke-width="4"/>',
         "open": '<ellipse cx="0" cy="28" rx="7" ry="9"/>',
         "frown": '<path d="M-8,32 Q0,25 8,32" fill="none" stroke="#000" stroke-width="5"/>',
         "flat": '<path d="M-7,31 L9,29" fill="none" stroke="#000" stroke-width="5"/>',
         "none": ""}[mouth]
    return (
        f'<path d="M-50,10 L-72,-5 L-58,-20 L-78,-40 L-52,-48 L-60,-72 L-32,-62 L-25,-85 L-5,-66 L12,-88 L25,-64 '
        f'L48,-78 L50,-52 L75,-50 L60,-28 L80,-8 L52,8 Z" fill="{HAIR}" stroke="#000" stroke-width="7"/>'
        f'{limbs}'
        f'<path d="M-6,46 L-28,130 L28,130 L6,46 Z" stroke="#000" stroke-width="6"/>'
        f'<path d="M-5,54 L5,54 L9,120 L-9,120 Z" fill="{YELLOW}"/>'
        f'<circle cx="0" cy="0" r="48" fill="#FFF" stroke="#000" stroke-width="9"/>'
        f'{eyes}<path d="{brows}" fill="none" stroke="#000" stroke-width="5"/>{m}'
        f'<path d="M-26,14 Q-12,1 0,11 Q12,1 26,14 Q12,27 0,20 Q-12,27 -26,14 Z" fill="{GREY}" stroke="#000" '
        f'stroke-width="4"/>'), hand


def xiaobai(pose="stand", face="neutral"):
    eyes, brows, mouth = XB_FACES.get(face, XB_FACES["neutral"])
    limbs, hand = _limbs(pose)
    return (
        f'<path d="M-10,-46 L-16,-70 M0,-48 L2,-76 M10,-46 L20,-68" fill="none" stroke="#000" stroke-width="7"/>'
        f'{limbs}'
        f'<path d="M-8,46 L-24,130 L24,130 L8,46 Z" fill="{GREY}" stroke="#000" stroke-width="8"/>'
        f'<circle cx="0" cy="0" r="46" fill="#FFF" stroke="#000" stroke-width="9"/>'
        f'{eyes}<path d="{brows}" fill="none" stroke="#000" stroke-width="5"/>'
        f'<path d="{mouth}" fill="none" stroke="#000" stroke-width="5"/>'), hand


BOT_FACES = dict(XB_FACES)
BOT_FACES["sleepy"] = ('<path d="M-24,-8 q9,9 18,0 M6,-8 q9,9 18,0" fill="none" stroke="#000" stroke-width="5"/>',
                       "", "M-6,18 L10,18")


def bot(pose="stand", face="neutral", accent=False):
    eyes, brows, mouth = BOT_FACES.get(face, BOT_FACES["neutral"])
    limbs, hand = _limbs(pose)
    tie = YELLOW if accent else GREY
    return (
        f'<path d="M0,-50 V-70" fill="none" stroke="#000" stroke-width="7"/>'
        f'<circle cx="0" cy="-76" r="8" fill="{tie}" stroke="#000" stroke-width="5"/>'
        f'{limbs}'
        f'<path d="M-6,46 L-28,130 L28,130 L6,46 Z" stroke="#000" stroke-width="6"/>'
        f'<path d="M-5,54 L5,54 L9,120 L-9,120 Z" fill="{tie}"/>'
        f'<rect x="-50" y="-48" width="100" height="94" rx="12" fill="#FFF" stroke="#000" stroke-width="10"/>'
        f'{eyes}<path d="{brows}" fill="none" stroke="#000" stroke-width="5"/>'
        f'<path d="{mouth}" fill="none" stroke="#000" stroke-width="5"/>'), hand


ACTORS = {"ein": einstein, "xiaobai": xiaobai, "bot": bot}

_S = 'fill="none" stroke="#000" stroke-width="8"'
PROPS = {
    "laptop":   f'<path d="M-70,-60 H70 V30 H-70 Z" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<path d="M-50,-40 H-5 V10 H-50 Z M10,-40 H50 V10 H10 Z" fill="{YELLOW}" stroke="#000" stroke-width="5"/>'
                f'<path d="M-70,30 L-100,75 H100 L70,30" fill="#FFF" stroke="#000" stroke-width="8"/>',
    "browser":  f'<rect x="-100" y="-80" width="200" height="160" rx="10" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<path d="M-100,-48 H100" {_S}/><circle cx="-80" cy="-64" r="5"/><circle cx="-62" cy="-64" r="5"/>'
                f'<rect x="-80" y="-28" width="70" height="90" fill="{YELLOW}" stroke="#000" stroke-width="5"/>'
                f'<path d="M10,-20 H80 M10,5 H80 M10,30 H55" {_S}/>',
    "doc":      f'<path d="M-55,-80 H30 L55,-55 V80 H-55 Z" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<path d="M-30,-35 H30 M-30,-5 H30 M-30,25 H10" {_S}/>'
                f'<path d="M30,-80 V-55 H55" {_S}/>',
    "checklist": f'<path d="M-90,-60 h36 v36 h-36 Z M-90,20 h36 v36 h-36 Z" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<path d="M-84,-44 L-72,-30 L-50,-70 M-84,36 L-72,50 L-50,10" fill="none" stroke="{YELLOW}" stroke-width="10"/>'
                f'<path d="M-84,-44 L-72,-30 L-50,-70 M-84,36 L-72,50 L-50,10" fill="none" stroke="#000" stroke-width="3"/>'
                f'<path d="M-30,-42 H90 M-30,38 H90" {_S}/>',
    "cursor":   f'<path d="M-30,-45 L-30,35 L-8,15 L8,50 L24,42 L8,8 L36,6 Z" fill="{YELLOW}" stroke="#000" stroke-width="8"/>',
    "bulb":     f'<path d="M-12,-100 V-120 M-62,-78 L-76,-92 M62,-78 L76,-92 M-84,-25 H-104 M84,-25 H104" {_S}/>'
                f'<path d="M-28,40 Q-30,15 -48,-5 A55,55 0 1 1 48,-5 Q30,15 28,40 Z" fill="{YELLOW}" stroke="#000" stroke-width="8"/>'
                f'<path d="M-24,58 H24 M-16,76 H16" {_S}/>',
    "glasses":  f'<path d="M-90,-20 h70 v40 h-70 Z M20,-20 h70 v40 h-70 Z" fill="#FFF" stroke="#000" stroke-width="9"/>'
                f'<path d="M-20,-5 H20 M90,-10 L115,-30" {_S}/>',
    "chart":    f'<path d="M-90,-80 V70 H95" {_S}/>'
                f'<path d="M-70,40 L-25,5 L10,25 L75,-55" fill="none" stroke="{YELLOW}" stroke-width="14"/>'
                f'<path d="M-70,40 L-25,5 L10,25 L75,-55 M75,-55 l-28,4 M75,-55 l-4,28" fill="none" stroke="#000" stroke-width="5"/>',
    "bars":     f'<path d="M-90,70 H95" {_S}/><rect x="-70" y="10" width="36" height="60" fill="#FFF" stroke="#000" stroke-width="7"/>'
                f'<rect x="-18" y="-25" width="36" height="95" fill="#FFF" stroke="#000" stroke-width="7"/>'
                f'<rect x="34" y="-75" width="36" height="145" fill="{YELLOW}" stroke="#000" stroke-width="7"/>',
    "clock":    f'<circle r="75" fill="#FFF" stroke="#000" stroke-width="9"/><path d="M0,-45 V0 L32,20" {_S}/>',
    "coin":     f'<circle r="70" fill="{YELLOW}" stroke="#000" stroke-width="9"/><path d="M-22,-30 L0,0 L22,-30 M0,0 V42 M-24,8 H24 M-24,26 H24" {_S}/>',
    "cup":      f'<path d="M-30,-25 H30 L24,45 H-24 Z" fill="{YELLOW}" stroke="#000" stroke-width="8"/>'
                f'<path d="M30,-10 q28,4 22,24 q-6,12 -26,10 M-10,-45 q-8,-14 0,-26 M12,-45 q-8,-14 0,-26" {_S}/>',
    "robot":    f'<path d="M0,-95 V-70" {_S}/><circle cx="0" cy="-100" r="9" fill="{YELLOW}" stroke="#000" stroke-width="6"/>'
                f'<rect x="-70" y="-70" width="140" height="105" rx="16" fill="#FFF" stroke="#000" stroke-width="9"/>'
                f'<circle cx="-28" cy="-25" r="12"/><circle cx="28" cy="-25" r="12"/><path d="M-25,10 H25" {_S}/>'
                f'<path d="M-40,35 L-48,95 H48 L40,35" fill="{GREY}" stroke="#000" stroke-width="9"/>',
    "box":      f'<path d="M-80,-40 L0,-80 L80,-40 V50 L0,90 L-80,50 Z" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<path d="M-80,-40 L0,0 L80,-40 L0,-80 Z" fill="{YELLOW}" stroke="#000" stroke-width="8"/><path d="M0,0 V90" {_S}/>',
    "wall":     f'<path d="M-90,-90 H90 V90 H-90 Z" fill="{GREY}" stroke="#000" stroke-width="8"/>'
                f'<path d="M-90,-30 H90 M-90,30 H90 M0,-90 V-30 M-45,-30 V30 M45,-30 V30 M0,30 V90" {_S}/>',
    "question": f'<path d="M-35,-45 Q-35,-95 5,-95 Q48,-95 45,-52 Q42,-20 5,-8 V22" fill="none" stroke="{YELLOW}" stroke-width="26"/>'
                f'<path d="M-35,-45 Q-35,-95 5,-95 Q48,-95 45,-52 Q42,-20 5,-8 V22" fill="none" stroke="#000" stroke-width="6"/>'
                f'<circle cx="5" cy="70" r="16" fill="{YELLOW}" stroke="#000" stroke-width="6"/>',
    "exclaim":  f'<path d="M-16,-95 H16 L8,25 H-8 Z" fill="{YELLOW}" stroke="#000" stroke-width="7"/>'
                f'<circle cx="0" cy="68" r="16" fill="{YELLOW}" stroke="#000" stroke-width="7"/>',
    "cross":    f'<path d="M-55,-55 L55,55 M55,-55 L-55,55" fill="none" stroke="{RED}" stroke-width="22"/>',
    "check":    f'<path d="M-60,0 L-18,48 L65,-55" fill="none" stroke="{YELLOW}" stroke-width="30"/>'
                f'<path d="M-60,0 L-18,48 L65,-55" fill="none" stroke="#000" stroke-width="7"/>',
    "pan":      f'<path d="M78,-6 H160" fill="none" stroke="#000" stroke-width="16" stroke-linecap="round"/>'
                f'<path d="M-82,-10 H82 Q78,52 0,52 Q-78,52 -82,-10 Z" fill="#FFF" stroke="#000" stroke-width="8"/>'
                f'<ellipse cx="0" cy="-10" rx="62" ry="11" fill="{YELLOW}" stroke="#000" stroke-width="5"/>'
                f'<path d="M-40,-34 q12,-18 0,-36 M0,-34 q12,-18 0,-36 M40,-34 q12,-18 0,-36" {_S}/>',
    "chefhat":  f'<path d="M-52,45 V2 Q-95,-8 -74,-52 Q-52,-88 -16,-66 Q0,-104 32,-78 Q74,-92 82,-46 Q96,-4 52,2 V45 Z"'
                f' fill="#FFF" stroke="#000" stroke-width="8"/><path d="M-52,24 H52" {_S}/>',
    "tangle":   f'<path d="M-60,-10 C-70,-70 20,-80 40,-30 C60,20 -20,60 -45,20 C-70,-20 10,-55 30,-5 '
                f'C45,35 -35,45 -30,5 C-25,-30 25,-25 15,10 C5,40 -60,30 -55,-15 C-50,-60 55,-60 60,0 '
                f'C62,50 -10,70 -40,45" fill="none" stroke="#000" stroke-width="7"/>',
    "arrow":    f'<path d="M-90,0 H70" fill="none" stroke="{YELLOW}" stroke-width="22"/>'
                f'<path d="M-90,0 H78 M78,0 L40,-34 M78,0 L40,34" {_S}/>',
}
