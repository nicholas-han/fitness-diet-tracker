// Workout templates extracted from the original trainingData.ts
// These are immutable templates that users claim for specific dates

export type ExerciseType = "warmup" | "main" | "core" | "cooldown";
export type SessionType = "strength" | "cardio" | "core" | "hyrox";

export interface SetTemplate {
  targetReps: string;
  targetWeight?: number;
  isBodyweight?: boolean;
  isTimed?: boolean;
  isDistance?: boolean;
  isAssisted?: boolean;
  targetAssistWeight?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: SetTemplate[];
  rest?: string;
  desc: string;
  type: ExerciseType;
  reps?: string;
}

export interface Session {
  type: SessionType;
  label: string;
  durationMin: number;
  warmup: Exercise[];
  main: Exercise[];
  cooldown: Exercise[];
}

export interface WorkoutTemplate {
  id: string;
  category: "main" | "core" | "cardio";
  title: string;
  description: string;
  intensity: "high" | "medium" | "low";
  sessionA?: Session;
  sessionB?: Session;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bw(reps: string): SetTemplate { return { targetReps: reps, isBodyweight: true }; }
function wt(reps: string, weight: number): SetTemplate { return { targetReps: reps, targetWeight: weight }; }
function timed(dur: string): SetTemplate { return { targetReps: dur, isBodyweight: true, isTimed: true }; }
function dist(d: string): SetTemplate { return { targetReps: d, isBodyweight: true, isDistance: true }; }
function assisted(reps: string, assistKg: number): SetTemplate {
  return { targetReps: reps, isBodyweight: true, isAssisted: true, targetAssistWeight: assistKg };
}
function bwSets(n: number, reps: string): SetTemplate[] { return Array(n).fill(null).map(() => bw(reps)); }
function wtSets(n: number, reps: string, kg: number): SetTemplate[] { return Array(n).fill(null).map(() => wt(reps, kg)); }
function timedSets(n: number, dur: string): SetTemplate[] { return Array(n).fill(null).map(() => timed(dur)); }
function single(reps: string): SetTemplate[] { return [bw(reps)]; }

// ─── Reusable Warmup / Cooldown Blocks ───────────────────────────────────────

const STRENGTH_WARMUP_UPPER: Exercise[] = [
  { id: "sw-u1", name: "肩部环绕", sets: single("前后各 15 次"), desc: "站立，双臂伸直，以肩关节为轴缓慢画大圈，充分激活肩袖肌群。", type: "warmup", reps: "前后各 15 次" },
  { id: "sw-u2", name: "弹力带面拉", sets: [{ targetReps: "15 次×2", isBodyweight: true }], desc: "双手握弹力带，向面部方向拉开，肘与肩同高，激活后三角肌和菱形肌。", type: "warmup", reps: "15 次×2" },
  { id: "sw-u3", name: "猫牛式", sets: single("10 次"), desc: "四点跪姿，吸气脊柱下沉（牛式），呼气脊柱上拱（猫式），激活脊柱灵活性。", type: "warmup", reps: "10 次" },
  { id: "sw-u4", name: "胸椎旋转", sets: single("每侧 8 次"), desc: "侧卧，下方腿弯曲固定，上方手臂向后旋转打开，充分活动胸椎。", type: "warmup", reps: "每侧 8 次" },
];

const STRENGTH_WARMUP_LOWER: Exercise[] = [
  { id: "sw-l1", name: "原地高抬腿", sets: [timed("30 秒")], desc: "缓慢高抬腿，逐步激活心肺，为腿部训练做准备。", type: "warmup", reps: "30 秒" },
  { id: "sw-l2", name: "动态弓步", sets: single("每侧 8 次"), desc: "行进间弓步，同时双手向上伸展，激活髋部屈肌和股四头肌。", type: "warmup", reps: "每侧 8 次" },
  { id: "sw-l3", name: "髋部环绕", sets: single("每侧 10 次"), desc: "单腿站立，另一腿做大幅度髋关节环绕，充分打开髋部活动度。", type: "warmup", reps: "每侧 10 次" },
  { id: "sw-l4", name: "腿部摆动", sets: single("每侧 10 次"), desc: "单腿站立，另一腿前后大幅摆动，拉伸腘绳肌和髋屈肌。", type: "warmup", reps: "每侧 10 次" },
];

const STRENGTH_WARMUP_FULL: Exercise[] = [
  { id: "sw-f1", name: "开合跳", sets: [timed("30 秒")], desc: "跳起时双脚分开，双手过头顶击掌，落地时还原，保持节奏。", type: "warmup", reps: "30 秒" },
  { id: "sw-f2", name: "动态弓步+扭转", sets: single("每侧 8 次"), desc: "行进间弓步，前腿落地后躯干向前腿方向旋转，激活全身。", type: "warmup", reps: "每侧 8 次" },
  { id: "sw-f3", name: "俯卧撑（慢速热身）", sets: bwSets(1, "8 次"), desc: "慢速俯卧撑，下降3秒，感受胸肌和三头肌激活，不追求速度。", type: "warmup", reps: "8 次" },
  { id: "sw-f4", name: "深蹲（空手热身）", sets: bwSets(1, "10 次"), desc: "慢速深蹲，感受膝盖、髋部和踝关节的活动，激活下肢肌群。", type: "warmup", reps: "10 次" },
];

const STRENGTH_WARMUP_SHOULDER: Exercise[] = [
  { id: "sw-s1", name: "肩部环绕", sets: single("15 次"), desc: "站立，双臂伸直，以肩关节为轴缓慢画大圈，充分激活肩袖肌群。", type: "warmup", reps: "15 次" },
  { id: "sw-s2", name: "弹力带面拉", sets: single("15 次"), desc: "双手握弹力带，向面部方向拉开，肘与肩同高，激活后三角肌。", type: "warmup", reps: "15 次" },
  { id: "sw-s3", name: "侧平举（空手热身）", sets: bwSets(1, "15 次"), desc: "空手模拟侧平举动作，感受三角肌中束激活，建立神经肌肉连接。", type: "warmup", reps: "15 次" },
  { id: "sw-s4", name: "手腕环绕", sets: single("各 10 次"), desc: "双手腕顺逆时针各环绕10次，预防训练中手腕损伤。", type: "warmup", reps: "各 10 次" },
];

const STRENGTH_WARMUP_LOW: Exercise[] = [
  { id: "sw-lo1", name: "关节环绕", sets: single("各 10 次"), desc: "依次活动踝关节、膝关节、髋关节、肩关节，每个关节顺逆时针各10次，全面预热。", type: "warmup", reps: "各 10 次" },
];

const COOLDOWN_UPPER: Exercise[] = [
  { id: "cd-u1", name: "背阔肌拉伸", sets: single("每侧 45 秒"), desc: "一手抓住固定物（器械或门框），身体向对侧倾斜，感受背阔肌深度拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-u2", name: "胸椎伸展", sets: [timed("60 秒")], desc: "坐在椅子边缘，双手交叉放于脑后，缓慢向后伸展胸椎，感受胸部和背部放松。", type: "cooldown", reps: "60 秒" },
  { id: "cd-u3", name: "肩部静态拉伸", sets: single("每侧 45 秒"), desc: "一手横过胸前，另一手在肘部施压，感受三角肌后束拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-u4", name: "颈部侧拉伸", sets: single("每侧 30 秒"), desc: "头部缓慢向一侧倾斜，感受颈部侧面肌肉拉伸，不要用力拉扯。", type: "cooldown", reps: "每侧 30 秒" },
];

const COOLDOWN_CHEST: Exercise[] = [
  { id: "cd-c1", name: "胸部门框拉伸", sets: single("每侧 45 秒"), desc: "一手扶门框，身体向对侧转动，感受胸大肌深度拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-c2", name: "肩前侧拉伸", sets: single("每侧 45 秒"), desc: "一手向后伸直，掌心朝上，感受肩部前侧和胸肌上部拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-c3", name: "三头肌过头拉伸", sets: single("每侧 30 秒"), desc: "一手过头弯曲，另一手在肘部轻压，感受三头肌拉伸。", type: "cooldown", reps: "每侧 30 秒" },
  { id: "cd-c4", name: "胸椎旋转放松", sets: single("每侧 8 次"), desc: "坐姿，双手交叉放于胸前，缓慢左右旋转胸椎，放松胸背部肌群。", type: "cooldown", reps: "每侧 8 次" },
];

const COOLDOWN_LOWER: Exercise[] = [
  { id: "cd-l1", name: "大腿前侧拉伸", sets: single("每侧 45 秒"), desc: "侧卧，抓住脚踝向臀部拉近，感受股四头肌深度拉伸，保持骨盆中立。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-l2", name: "大腿后侧拉伸", sets: single("每侧 45 秒"), desc: "仰卧，一腿伸直向上抬起，双手抱住大腿后侧，感受腘绳肌拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-l3", name: "臀部鸽子式", sets: single("每侧 45 秒"), desc: "前腿弯曲成90°放于地面，后腿伸直，上身前倾，深度拉伸臀部和梨状肌。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cd-l4", name: "小腿拉伸", sets: single("每侧 30 秒"), desc: "面向墙壁，一脚向后伸直，脚跟踩地，感受腓肠肌拉伸。", type: "cooldown", reps: "每侧 30 秒" },
];

const COOLDOWN_SHOULDER: Exercise[] = [
  { id: "cd-s1", name: "肩部各方向拉伸", sets: single("各 30 秒"), desc: "依次做前侧、后侧、上方三个方向的肩部拉伸，全面放松肩部肌群。", type: "cooldown", reps: "各 30 秒" },
  { id: "cd-s2", name: "二头肌墙壁拉伸", sets: single("每侧 30 秒"), desc: "一手贴墙，掌心朝外，身体向对侧转动，感受二头肌和前臂拉伸。", type: "cooldown", reps: "每侧 30 秒" },
  { id: "cd-s3", name: "颈肩放松", sets: [timed("60 秒")], desc: "缓慢做颈部前后左右各方向的轻柔活动，配合深呼吸放松颈肩。", type: "cooldown", reps: "60 秒" },
];

const COOLDOWN_FULL: Exercise[] = [
  { id: "cd-f1", name: "全身流动拉伸", sets: [timed("7 分钟")], desc: "依次拉伸脊柱（猫牛式）、髋部（鸽子式）、肩部（门框拉伸）、腿部（前后侧），每个动作30-45秒，配合深呼吸。", type: "cooldown", reps: "7 分钟" },
];

const COOLDOWN_LOW: Exercise[] = [
  { id: "cd-lo1", name: "上肢静态拉伸", sets: [timed("5 分钟")], desc: "依次拉伸肩部、胸部、三头肌，每个动作30秒，放松上肢肌群。", type: "cooldown", reps: "5 分钟" },
];

const COOLDOWN_LOW_LOWER: Exercise[] = [
  { id: "cd-ll1", name: "下肢静态拉伸", sets: [timed("5 分钟")], desc: "依次拉伸大腿前侧、后侧、臀部，每个动作30秒，放松下肢肌群。", type: "cooldown", reps: "5 分钟" },
];

const CARDIO_WARMUP: Exercise[] = [
  { id: "cw-1", name: "慢走→快走", sets: [timed("3 分钟")], desc: "从慢走逐渐加速到快走，让心率缓慢提升至100bpm左右，预热关节。", type: "warmup", reps: "3 分钟" },
  { id: "cw-2", name: "动态弓步", sets: single("每侧 8 次"), desc: "行进间弓步，激活髋部和大腿肌群，为跑步做准备。", type: "warmup", reps: "每侧 8 次" },
  { id: "cw-3", name: "腿部摆动", sets: single("每侧 10 次"), desc: "单腿站立，另一腿前后大幅摆动，拉伸腘绳肌和髋屈肌。", type: "warmup", reps: "每侧 10 次" },
  { id: "cw-4", name: "原地高抬腿", sets: [timed("30 秒")], desc: "缓慢高抬腿，逐步激活心肺，让身体进入跑步状态。", type: "warmup", reps: "30 秒" },
];

const CARDIO_COOLDOWN: Exercise[] = [
  { id: "cc-1", name: "慢走放松", sets: [timed("3 分钟")], desc: "跑步结束后立即慢走，让心率缓慢降至100bpm以下，避免血液积聚。", type: "cooldown", reps: "3 分钟" },
  { id: "cc-2", name: "小腿拉伸", sets: single("每侧 45 秒"), desc: "面向墙壁，一脚向后伸直，脚跟踩地，感受腓肠肌和比目鱼肌拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cc-3", name: "大腿后侧拉伸", sets: single("每侧 45 秒"), desc: "一腿伸直放于稍高处（如台阶），上身前倾，感受腘绳肌拉伸。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "cc-4", name: "髋屈肌拉伸", sets: single("每侧 45 秒"), desc: "弓步姿势，后膝跪地，上身直立，感受后腿髋屈肌拉伸，跑步后尤为重要。", type: "cooldown", reps: "每侧 45 秒" },
];

const CORE_WARMUP: Exercise[] = [
  { id: "crw-1", name: "腹式呼吸激活", sets: bwSets(1, "10 次"), desc: "仰卧，一手放胸口一手放腹部，吸气时腹部隆起，呼气时腹部下沉，激活腹横肌。", type: "warmup", reps: "10 次" },
  { id: "crw-2", name: "死虫式（慢速激活）", sets: bwSets(1, "每侧 6 次"), desc: "仰卧，手臂指向天花板，腿抬起成90°，缓慢伸展对侧手脚，腰部全程贴地，激活深层核心。", type: "warmup", reps: "每侧 6 次" },
  { id: "crw-3", name: "猫牛式", sets: bwSets(1, "10 次"), desc: "四点跪姿，吸气脊柱下沉，呼气脊柱上拱，激活脊柱稳定肌群。", type: "warmup", reps: "10 次" },
  { id: "crw-4", name: "鸟狗式", sets: bwSets(1, "每侧 8 次"), desc: "四点跪姿，同时伸展对侧手臂和腿，保持脊柱中立，激活多裂肌和臀部。", type: "warmup", reps: "每侧 8 次" },
];

const CORE_COOLDOWN: Exercise[] = [
  { id: "crc-1", name: "婴儿式", sets: [timed("60 秒")], desc: "跪坐，上身前倾贴地，手臂向前伸展，深度放松脊柱和背部肌群。", type: "cooldown", reps: "60 秒" },
  { id: "crc-2", name: "脊柱扭转", sets: single("每侧 45 秒"), desc: "仰卧，一腿弯曲向对侧倒，双臂展开，感受脊柱和腹斜肌的深度放松。", type: "cooldown", reps: "每侧 45 秒" },
  { id: "crc-3", name: "猫牛式放松", sets: bwSets(1, "10 次"), desc: "缓慢进行猫牛式，配合深呼吸，放松整个脊柱和核心肌群。", type: "cooldown", reps: "10 次" },
];

// ─── Workout Templates ─────────────────────────────────────────────────────────

// 1. 胸+三头 (Chest + Triceps)
const chestTriceps: WorkoutTemplate = {
  id: "chest_triceps",
  category: "main",
  title: "胸部 + 三头",
  description: "胸部推力训练 + 三头孤立训练",
  intensity: "medium",
  sessionA: {
    type: "strength", label: "胸部 & 推力", durationMin: 45,
    warmup: [
      { id: "sw-ct-1", name: "开合跳", sets: [timed("30 秒")], desc: "跳起时双脚分开，双手过头顶击掌，落地时还原，激活全身。", type: "warmup", reps: "30 秒" },
      { id: "sw-ct-2", name: "动态胸部拉伸", sets: single("15 次"), desc: "双臂向两侧展开，然后在胸前交叉，反复进行，激活胸肌和肩部。", type: "warmup", reps: "15 次" },
      { id: "sw-ct-3", name: "俯卧撑（慢速热身）", sets: bwSets(1, "8 次"), desc: "慢速俯卧撑，下降3秒，感受胸肌和三头肌激活。", type: "warmup", reps: "8 次" },
      { id: "sw-ct-4", name: "肩部激活", sets: single("15 次"), desc: "弹力带外旋或空手肩部环绕，激活肩袖肌群，预防推举时肩部损伤。", type: "warmup", reps: "15 次" },
    ],
    main: [
      { id: "ct-1", name: "哑铃卧推", sets: wtSets(4, "10-12 次", 15), rest: "90s", desc: "仰卧于凳子，哑铃置于胸侧，推起时手肘不要完全锁死，控制离心下降2秒。", type: "main" },
      { id: "ct-2", name: "上斜哑铃卧推", sets: wtSets(3, "10-12 次", 12), rest: "90s", desc: "调整座椅角度约30-45°，重点感受上胸（锁骨头）发力。", type: "main" },
      { id: "ct-3", name: "哑铃飞鸟", sets: wtSets(3, "12 次", 8), rest: "60s", desc: "仰卧，双手持哑铃，手肘微弯，向两侧打开至感受胸肌充分拉伸，再收回，孤立训练胸肌。", type: "main" },
      { id: "ct-4", name: "哑铃侧平举", sets: wtSets(3, "12-15 次", 8), rest: "60s", desc: "双手持哑铃，手肘微弯，向两侧抬起至肩部高度，控制离心3秒还原，不要借力晃动。", type: "main" },
      { id: "ct-5", name: "绳索下压（或哑铃臂屈伸）", sets: wtSets(3, "12-15 次", 20), rest: "60s", desc: "站立，大臂贴紧身体，用肱三头肌发力向下压，顶峰停留1秒，孤立训练三头肌。", type: "main" },
    ],
    cooldown: COOLDOWN_CHEST,
  },
};

// 2. 背部+二头肌 (Back + Biceps)
const backBiceps: WorkoutTemplate = {
  id: "back_biceps",
  category: "main",
  title: "背部 + 二头肌",
  description: "背部拉力训练 + 二头孤立训练",
  intensity: "high",
  sessionA: {
    type: "strength", label: "背部 & 拉力", durationMin: 45,
    warmup: [
      { id: "sw-u1", name: "肩部环绕", sets: single("前后各 15 次"), desc: "站立，双臂伸直，以肩关节为轴缓慢画大圈，充分激活肩袖肌群。", type: "warmup", reps: "前后各 15 次" },
      { id: "sw-u3", name: "猫牛式", sets: single("10 次"), desc: "四点跪姿，吸气脊柱下沉（牛式），呼气脊柱上拱（猫式），激活脊柱灵活性。", type: "warmup", reps: "10 次" },
      { id: "sw-u4", name: "胸椎旋转", sets: single("每侧 8 次"), desc: "侧卧，下方腿弯曲固定，上方手臂向后旋转打开，充分活动胸椎。", type: "warmup", reps: "每侧 8 次" },
    ],
    main: [
      { id: "bb-1w", name: "宽距高位下拉", sets: wtSets(3, "8-10 次", 50), rest: "90s", desc: "坐姿，双手宽握（比肩宽约1.5倍），收紧核心，背阔肌发力将横杆拉至锁骨，控制离心还原 2 秒。宽距侧重背阔肌外侧。", type: "main" },
      { id: "bb-1m", name: "中距高位下拉", sets: wtSets(3, "8-10 次", 50), rest: "90s", desc: "坐姿，双手与肩同宽握，收紧核心，背阔肌发力将横杆拉至锁骨，控制离心还原 2 秒。中距均衡发展背部整体。", type: "main" },
      { id: "bb-1n", name: "窄距高位下拉", sets: wtSets(3, "8-10 次", 50), rest: "90s", desc: "坐姿，双手窄握（比肩窄），收紧核心，背阔肌发力将横杆拉至锁骨，控制离心还原 2 秒。窄距侧重背阔肌内侧和下背部。", type: "main" },
      { id: "bb-2", name: "坐姿划船", sets: wtSets(4, "10-12 次", 45), rest: "90s", desc: "坐姿，双手握把，保持躯干直立，肩胛骨向后收紧，顶峰停留 1 秒。", type: "main" },
      { id: "bb-3", name: "辅助引体向上", sets: Array(3).fill(null).map(() => assisted("6-8 次", 30)), rest: "90s", desc: "使用辅助器械，全幅度完成动作，专注感受背阔肌发力。辅助重量越小表示力量越强。", type: "main" },
      { id: "bb-4", name: "哑铃单臂划船", sets: wtSets(3, "10 次/侧", 15), rest: "60s", desc: "单手支撑凳子，手肘贴近身体向后拉，躯干保持水平，感受背部收缩。", type: "main" },
      { id: "bb-6", name: "站姿二头哑铃弯举", sets: wtSets(3, "10-12 次", 12), rest: "60s", desc: "站立，双手持哑铃，肘部固定贴紧身体，二头肌发力弯举至肩部，控制离心下放 2 秒。", type: "main" },
    ],
    cooldown: COOLDOWN_UPPER,
  },
};

// 3. 肩+腿 (Shoulders + Legs)
const shoulderLegs: WorkoutTemplate = {
  id: "shoulder_legs",
  category: "main",
  title: "肩 + 腿",
  description: "肩部推举 + 腿部复合训练",
  intensity: "high",
  sessionA: {
    type: "strength", label: "肩部 & 手臂", durationMin: 45,
    warmup: STRENGTH_WARMUP_SHOULDER,
    main: [
      { id: "sl-1", name: "哑铃肩推", sets: wtSets(4, "10-12 次", 12), rest: "90s", desc: "坐姿或站姿，哑铃置于肩侧，推起至头顶，不要完全锁死肘关节，控制离心还原。", type: "main" },
      { id: "sl-2", name: "哑铃侧平举", sets: wtSets(3, "12-15 次", 8), rest: "60s", desc: "双手持哑铃，手肘微弯，向两侧抬起至肩部高度，控制离心3秒还原。", type: "main" },
      { id: "sl-3", name: "哑铃前平举", sets: wtSets(3, "12 次", 8), rest: "60s", desc: "双手持哑铃，交替向前抬起至肩高，感受三角肌前束发力，不要借力摆动。", type: "main" },
      { id: "sl-4", name: "哑铃弯举（二头）", sets: wtSets(3, "12 次", 10), rest: "60s", desc: "站姿，双手持哑铃，交替弯曲手肘，顶峰收缩1秒，控制离心还原，大臂贴紧身体。", type: "main" },
      { id: "sl-5", name: "宽距俯卧撑", sets: bwSets(3, "12-15 次"), rest: "60s", desc: "双手宽于肩膀约1.5倍，重点感受胸肌外侧和三头肌发力，保持核心收紧。", type: "main" },
    ],
    cooldown: COOLDOWN_SHOULDER,
  },
  sessionB: {
    type: "strength", label: "腿部训练", durationMin: 45,
    warmup: STRENGTH_WARMUP_LOWER,
    main: [
      { id: "sl-b1", name: "杠铃深蹲", sets: wtSets(4, "8-10 次", 60), rest: "120s", desc: "控制重量（以技术为先），下蹲至大腿平行或以下，核心收紧，膝盖不内扣，全程保持脊柱中立。", type: "main" },
      { id: "sl-b2", name: "器械腿举", sets: wtSets(4, "10-12 次", 80), rest: "90s", desc: "双脚与肩同宽，脚尖微微外展，推起时不要锁死膝关节，感受大腿前侧发力。", type: "main" },
      { id: "sl-b3", name: "哑铃弓步蹲", sets: wtSets(3, "10 次/侧", 12), rest: "90s", desc: "双手持哑铃，向前迈步，躯干直立，后膝接近但不触地，感受前腿臀部和大腿的发力。", type: "main" },
      { id: "sl-b4", name: "哑铃罗马尼亚硬拉", sets: wtSets(3, "10 次", 15), rest: "90s", desc: "双手持哑铃，膝盖微弯，上身前倾，哑铃沿腿部下滑，感受腘绳肌拉伸，再收缩臀部还原。", type: "main" },
      { id: "sl-b5", name: "坐姿腿屈伸", sets: wtSets(3, "12-15 次", 30), rest: "60s", desc: "调整靠垫至舒适位置，伸直腿时顶峰收缩1秒，控制离心还原，孤立训练股四头肌。", type: "main" },
    ],
    cooldown: COOLDOWN_LOWER,
  },
};

// 4. 腿 (Legs only)
const legsOnly: WorkoutTemplate = {
  id: "legs_only",
  category: "main",
  title: "腿部专项",
  description: "腿部力量 + 臀腿后链综合训练",
  intensity: "high",
  sessionA: {
    type: "strength", label: "腿部训练", durationMin: 45,
    warmup: STRENGTH_WARMUP_LOWER,
    main: [
      { id: "leg-1", name: "杠铃深蹲", sets: wtSets(4, "8-10 次", 60), rest: "120s", desc: "控制重量（以技术为先），下蹲至大腿平行或以下，核心收紧，膝盖不内扣，全程保持脊柱中立。", type: "main" },
      { id: "leg-2", name: "器械腿举", sets: wtSets(4, "10-12 次", 80), rest: "90s", desc: "双脚与肩同宽，脚尖微微外展，推起时不要锁死膝关节，感受大腿前侧发力。", type: "main" },
      { id: "leg-3", name: "哑铃弓步蹲", sets: wtSets(3, "10 次/侧", 12), rest: "90s", desc: "双手持哑铃，向前迈步，躯干直立，后膝接近但不触地，感受前腿臀部和大腿的发力。", type: "main" },
      { id: "leg-4", name: "哑铃罗马尼亚硬拉", sets: wtSets(3, "10 次", 15), rest: "90s", desc: "双手持哑铃，膝盖微弯，上身前倾，哑铃沿腿部下滑，感受腘绳肌拉伸，再收缩臀部还原。", type: "main" },
      { id: "leg-5", name: "坐姿腿屈伸", sets: wtSets(3, "12-15 次", 30), rest: "60s", desc: "调整靠垫至舒适位置，伸直腿时顶峰收缩1秒，控制离心还原，孤立训练股四头肌。", type: "main" },
    ],
    cooldown: COOLDOWN_LOWER,
  },
};

// 5. 胸背肩补充 (Chest/Back/Shoulder Supplement)
const chestBackShoulder: WorkoutTemplate = {
  id: "chest_back_shoulder",
  category: "main",
  title: "胸背肩补充",
  description: "全身复合力量 + Hyrox功能性训练",
  intensity: "high",
  sessionA: {
    type: "strength", label: "全身复合力量", durationMin: 45,
    warmup: STRENGTH_WARMUP_FULL,
    main: [
      { id: "cbs-1", name: "哑铃硬拉", sets: wtSets(4, "8 次", 15), rest: "90s", desc: "双手持哑铃，膝盖微弯，髋部铰链动作，背部全程保持平直，臀部发力站起，是全身性复合动作。", type: "main" },
      { id: "cbs-2", name: "哑铃俯身划船", sets: wtSets(3, "10 次", 15), rest: "90s", desc: "俯身约45°，双手持哑铃，手肘贴近身体向后拉，感受背部整体收缩。", type: "main" },
      { id: "cbs-3", name: "哑铃卧推", sets: wtSets(3, "10 次", 15), rest: "90s", desc: "仰卧于凳子，哑铃置于胸侧，推起时感受胸肌发力，控制离心下降。", type: "main" },
      { id: "cbs-4", name: "哑铃深蹲+推举（组合）", sets: wtSets(3, "10 次", 10), rest: "90s", desc: "双手持哑铃于肩侧，下蹲后站起同时将哑铃推举过头，是全身协调性训练，模拟Hyrox功能性动作。", type: "main" },
      { id: "cbs-5", name: "俯卧撑（变式交替）", sets: bwSets(3, "12 次"), rest: "60s", desc: "宽距和窄距俯卧撑交替进行，每次各6个，全面刺激胸肌和三头肌。", type: "main" },
    ],
    cooldown: COOLDOWN_FULL,
  },
};

// 6. 核心训练 (Core Training)
const coreTraining: WorkoutTemplate = {
  id: "core_training",
  category: "core",
  title: "核心训练",
  description: "深层核心稳定 + 腹部力量训练",
  intensity: "high",
  sessionA: {
    type: "core", label: "核心训练", durationMin: 50,
    warmup: CORE_WARMUP,
    main: [
      { id: "core-1", name: "平板支撑", sets: timedSets(3, "60 秒"), rest: "45s", desc: "双肘支撑，身体成一直线，收紧腹部和臀部，均匀呼吸，不要塌腰或翘臀。", type: "core" },
      { id: "core-2", name: "侧支撑", sets: timedSets(3, "45 秒/侧"), rest: "30s", desc: "侧卧，单肘支撑，保持身体成一直线，强化侧腰腹斜肌，不要让臀部下沉。", type: "core" },
      { id: "core-3", name: "死虫式", sets: bwSets(3, "12 次/侧"), rest: "45s", desc: "仰卧，手臂指向天花板，腿抬起成90°，缓慢伸展对侧手脚，腰部全程紧贴地面。", type: "core" },
      { id: "core-4", name: "仰卧举腿", sets: bwSets(3, "15 次"), rest: "45s", desc: "仰卧，双腿伸直，用下腹部发力将腿抬起至垂直，腰部全程贴地，缓慢还原。", type: "core" },
      { id: "core-5", name: "俄罗斯转体", sets: wtSets(3, "20 次/侧", 8), rest: "45s", desc: "坐姿，双脚离地，持哑铃快速左右旋转，感受腹斜肌发力，保持上身挺直。", type: "core" },
      { id: "core-6", name: "健腹轮/毛巾滑行", sets: bwSets(3, "8-10 次"), rest: "60s", desc: "跪姿，双手推轮向前滑出，身体接近地面但不触地，用腹部力量拉回，全程收紧核心。", type: "core" },
    ],
    cooldown: CORE_COOLDOWN,
  },
};

// 7a. 有氧：跑步 (Cardio: Running)
const cardioRunning: WorkoutTemplate = {
  id: "cardio_running",
  category: "cardio",
  title: "有氧：跑步",
  description: "间歇跑 / 有氧基础跑 / 轻松慢跑",
  intensity: "medium",
  sessionA: {
    type: "cardio", label: "间歇跑", durationMin: 50,
    warmup: CARDIO_WARMUP,
    main: [
      { id: "run-1", name: "间歇跑：400m × 5", sets: [{ targetReps: "400m × 5", isBodyweight: true, isDistance: true }], rest: "200m慢跑恢复", desc: "目标配速5:30/km，每组400m后慢跑200m恢复，总距离约4-5km。心率在高强度区间（160-175bpm），感受心肺系统的强化。", type: "main" },
    ],
    cooldown: CARDIO_COOLDOWN,
  },
  sessionB: {
    type: "cardio", label: "有氧基础跑", durationMin: 50,
    warmup: CARDIO_WARMUP,
    main: [
      { id: "run-2", name: "有氧基础跑", sets: [dist("5 km")], rest: "无", desc: "配速6:00-6:30/km，心率控制在130-145bpm的有氧区间，以能轻松说话为标准。注重心肺耐力积累，不追求速度。", type: "main" },
    ],
    cooldown: CARDIO_COOLDOWN,
  },
};

// 7b. 有氧：游泳 (Cardio: Swimming)
const cardioSwimming: WorkoutTemplate = {
  id: "cardio_swimming",
  category: "cardio",
  title: "有氧：游泳",
  description: "自由泳间歇 + 混合泳训练",
  intensity: "medium",
  sessionA: {
    type: "cardio", label: "游泳训练", durationMin: 45,
    warmup: [
      { id: "swim-w1", name: "陆上热身", sets: [timed("5 分钟")], desc: "肩部环绕、手臂摆动、髋部旋转、踝关节活动，激活全身关节。", type: "warmup", reps: "5 分钟" },
      { id: "swim-w2", name: "水中慢游热身", sets: [dist("200 m")], desc: "自由泳慢速游200m，感受水温和浮力，逐步激活游泳肌群。", type: "warmup", reps: "200 m" },
    ],
    main: [
      { id: "swim-1", name: "自由泳间歇", sets: [{ targetReps: "100m × 6", isBodyweight: true, isDistance: true }], rest: "30s休息", desc: "100m自由泳×6组，每组间歇30秒，目标配速每100m 1:50-2:00，保持技术稳定。", type: "main" },
      { id: "swim-2", name: "混合泳", sets: [{ targetReps: "50m × 4", isBodyweight: true, isDistance: true }], rest: "20s休息", desc: "蛙泳、仰泳、自由泳、蝶泳各50m，全面锻炼不同肌群，提升水性。", type: "main" },
    ],
    cooldown: [
      { id: "swim-c1", name: "放松游", sets: [dist("100 m")], desc: "自由泳慢速游100m放松，调整呼吸，降低心率。", type: "cooldown", reps: "100 m" },
      { id: "swim-c2", name: "陆上拉伸", sets: [timed("5 分钟")], desc: "肩部、胸部、背部拉伸，每个动作30秒，放松游泳后紧绷的肌群。", type: "cooldown", reps: "5 分钟" },
    ],
  },
};

// 7c. 有氧：自行车 (Cardio: Cycling)
const cardioCycling: WorkoutTemplate = {
  id: "cardio_cycling",
  category: "cardio",
  title: "有氧：自行车",
  description: "骑行间歇 + 有氧耐力骑行",
  intensity: "medium",
  sessionA: {
    type: "cardio", label: "自行车训练", durationMin: 50,
    warmup: [
      { id: "cyc-w1", name: "慢骑热身", sets: [timed("5 分钟")], desc: "低阻力慢骑5分钟，逐步提升心率至100bpm，激活腿部肌群。", type: "warmup", reps: "5 分钟" },
      { id: "cyc-w2", name: "动态拉伸", sets: [timed("3 分钟")], desc: "下车做腿部摆动、髋部环绕、踝关节活动，预防骑行中僵硬。", type: "warmup", reps: "3 分钟" },
    ],
    main: [
      { id: "cyc-1", name: "骑行间歇", sets: [{ targetReps: "2分钟 × 6", isBodyweight: true, isTimed: true }], rest: "2分钟慢骑恢复", desc: "高阻力2分钟×6组，每组间慢骑2分钟恢复，心率在高强度区间（160-175bpm），提升腿部力量和心肺能力。", type: "main" },
      { id: "cyc-2", name: "有氧耐力骑行", sets: [dist("10 km")], rest: "无", desc: "中等阻力骑行10km，心率130-145bpm，注重踏频节奏（80-90rpm），培养骑行耐力。", type: "main" },
    ],
    cooldown: [
      { id: "cyc-c1", name: "慢骑放松", sets: [timed("3 分钟")], desc: "低阻力慢骑3分钟，让心率缓慢降低。", type: "cooldown", reps: "3 分钟" },
      { id: "cyc-c2", name: "下肢拉伸", sets: [timed("5 分钟")], desc: "重点拉伸大腿前侧、后侧、小腿和髋部，每个动作30-45秒。", type: "cooldown", reps: "5 分钟" },
    ],
  },
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  chestTriceps,
  backBiceps,
  shoulderLegs,
  legsOnly,
  chestBackShoulder,
  coreTraining,
  cardioRunning,
  cardioSwimming,
  cardioCycling,
];

export const INTENSITY_CONFIG = {
  high:   { label: "高强度", color: "text-red-400",    bg: "bg-red-400/15",    border: "border-red-400/30" },
  medium: { label: "中强度", color: "text-orange-400", bg: "bg-orange-400/15", border: "border-orange-400/30" },
  low:    { label: "低强度", color: "text-green-400",  bg: "bg-green-400/15",  border: "border-green-400/30" },
};

export const SESSION_TYPE_CONFIG: Record<SessionType, { label: string; icon: string; color: string; bg: string }> = {
  strength: { label: "力量训练", icon: "💪", color: "text-orange-400", bg: "bg-orange-400/10" },
  cardio:   { label: "有氧跑步", icon: "🏃", color: "text-blue-400",   bg: "bg-blue-400/10" },
  core:     { label: "核心训练", icon: "🔥", color: "text-green-400",  bg: "bg-green-400/10" },
  hyrox:    { label: "Hyrox专项", icon: "⚡", color: "text-purple-400", bg: "bg-purple-400/10" },
};

export const SECTION_CONFIG: Record<ExerciseType, { label: string; color: string }> = {
  warmup:   { label: "热身", color: "text-yellow-400" },
  main:     { label: "主训练", color: "text-orange-400" },
  core:     { label: "核心", color: "text-green-400" },
  cooldown: { label: "冷身", color: "text-blue-400" },
};
