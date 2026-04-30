const ROLE_CARD_PROMPT = `## 任务指令
分析小说文本中的角色信息，生成结构化角色卡。剔除偶然特例，只提炼角色核心稳定特质，拒绝主观脑补、冗余赘述。最终输出可直接用于AI续写/改写的角色设定文档。

## 核心分析维度（必写，精准且不冗余）

### 一、核心角色分析（主角/重要配角，限3-5人，每角色详细分析）

#### 1. 基础特质
- 结合原文外貌、衣着、肢体动作、语言习惯，明确角色核心性格
- 必须包含：外貌特征（眉眼、轮廓、肤色、疤痕/痣等标志性特征）
- 必须包含：衣着风格（简约/繁复/复古等）、面料质感、颜色偏好、配饰细节
- 必须包含：神态与外貌的联动（如生气时眉峰紧绷、疲惫时眼窝凹陷）
- 示例：主角沉稳内敛，常穿深色简约长衫，说话语速平缓，生气时仅眉峰紧绷、攥紧指尖，无多余激烈动作

#### 2. 行为逻辑
- 明确角色核心行为动机、性格优缺点、情绪触发点
- 关联原文具体情节
- 必须包含：日常轻动作偏好（如垂眼、攥衣角）
- 必须包含：剧烈运动后的衍生反应（如喘息幅度、肌肉紧绷、汗水滴落位置、肢体僵硬/酸痛表现、呼吸节奏变化）

#### 3. 角色关系
- 梳理核心角色间的羁绊、矛盾、互动模式
- 结合语言、动作细节
- 必须包含：互动时的肢体距离、眼神交流、语言克制程度

#### 4. 成长/变化
- 结合原文情节、衣着、动作、语言的变化
- 明确角色成长轨迹
- 必须包含：衣着变化（场景切换、时间推移、情绪变化带来的衣着增减、褶皱、磨损等细节）

### 二、次要角色分析
- 每角色用1句话概括，明确核心功能
- 功能类型：推动剧情、衬托主角、渲染氛围、埋下伏笔
- 必须包含：衣着风格、神态特点

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "core_characters": [
    {
      "name": "角色名",
      "role_type": "主角/重要配角",
      "basic_traits": {
        "personality": "核心性格描述",
        "appearance": {
          "facial_features": "眉眼、轮廓、肤色等",
          "distinctive_marks": "疤痕/痣等标志性特征",
          "expression_linkage": "神态与外貌的联动"
        },
        "clothing_style": {
          "style": "简约/繁复/复古等",
          "fabric": "面料质感",
          "color_preference": "颜色偏好",
          "accessories": "配饰细节",
          "clothing_changes": "衣着变化规律"
        },
        "speech_habit": {
          "sentence_length": "句式长短",
          "tone_fluctuation": "语气起伏（平缓/急促/隐忍）",
          "speech_speed": "语速快慢",
          "dialect_catchphrase": "方言/口头禅",
          "emotional_speech_change": "情绪波动时的语言变化"
        },
        "body_language": {
          "daily_actions": ["日常轻动作偏好1", "日常轻动作偏好2"],
          "intense_reactions": {
            "breathing": "喘息幅度",
            "muscle_tension": "肌肉紧绷表现",
            "sweat": "汗水滴落位置",
            "stiffness": "肢体僵硬/酸痛表现",
            "rhythm_change": "呼吸节奏变化"
          }
        }
      },
      "behavior_logic": {
        "core_motivation": "核心行为动机",
        "strengths": ["优点1", "优点2"],
        "weaknesses": ["缺点1", "缺点2"],
        "emotional_triggers": ["情绪触发点1", "情绪触发点2"]
      },
      "relationships": [
        {
          "target": "关联角色名",
          "relationship_type": "关系类型",
          "interaction_mode": "互动模式描述",
          "physical_distance": "肢体距离",
          "eye_contact": "眼神交流特点",
          "speech_restraint": "语言克制程度"
        }
      ],
      "growth_arc": {
        "initial_state": "初始状态",
        "key_changes": ["关键变化1", "关键变化2"],
        "current_state": "当前状态",
        "clothing_evolution": "衣着演变过程"
      }
    }
  ],
  "minor_characters": [
    {
      "name": "角色名",
      "clothing_style": "衣着风格",
      "expression": "神态特点",
      "function": "核心功能描述"
    }
  ]
}
\`\`\`

## 注意事项
1. 全程基于输入文本，不主观脑补
2. 必须输出有效的JSON格式
3. 重点关联角色的语言、肢体动作、剧烈运动衍生反应、外貌、衣着及衣着变化`

const CHAPTER_ANALYSIS_PROMPT = `## 任务指令
逐章分析小说内容，每章分析严格遵循以下4点，重点关联角色语言、肢体动作、衣着细节，贴合整体剧情逻辑。全程基于原文文本，剔除偶然剧情特例、临时细节，提炼核心剧情逻辑，拒绝主观脑补、冗余赘述、过度解读。

## 核心分析维度（每章必写，详细分析）

### 1. 章节主旨
- 1句话概括本章核心内容
- 必须包含：本章在整体剧情中的定位
- 示例：第5章：主角与配角初次相遇，因衣着差异产生误会，引发争执，为后续矛盾埋下伏笔

### 2. 关键情节
- 本章推动剧情、塑造角色的核心事件
- 必须包含：情节发展中的肢体动作细节
- 必须包含：情绪转折点的描写
- 示例：主角因衣着破旧被配角轻视，争执中主角攥紧拳头、汗水滴落袖口，语气急促却不卑不亢，最终以配角冷哼离去告终

### 3. 角色表现（详细分析每个出场角色）
- 核心角色的语言表现：
  - 句式长短、语气起伏（平缓/急促/隐忍）
  - 语速快慢、方言/口头禅细节
  - 情绪波动时的语言变化（如紧张时结巴、愤怒时短促）
- 核心角色的肢体动作：
  - 日常轻动作偏好
  - 剧烈运动后的衍生反应（喘息幅度、肌肉紧绷、汗水滴落位置、肢体僵硬/酸痛表现、呼吸节奏变化）
- 核心角色的衣着变化：
  - 衣着风格、面料质感、颜色偏好
  - 场景切换、时间推移、情绪变化带来的衣着增减、褶皱、磨损等细节
- 示例：配角身着锦缎长袍，说话傲慢，眉峰微挑；主角衣着破旧却脊背挺直，说话短促有力，指尖因用力而泛白，袖口处可见汗渍

### 4. 章节作用
- 铺垫伏笔：明确伏笔内容与后续关联
- 推动冲突：明确冲突类型与升级程度
- 塑造角色：明确角色性格展示维度
- 过渡剧情：明确承上启下的功能
- 示例：本章铺垫主角与配角的核心矛盾，同时通过衣着、动作细节，强化两人的性格差异，为第8章的正面冲突做铺垫

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "chapters": [
    {
      "chapter_num": 1,
      "chapter_title": "章节标题",
      "summary": "章节主旨（1句话，包含剧情定位）",
      "key_events": [
        {
          "event": "关键情节描述",
          "body_language_detail": "肢体动作细节",
          "emotion_turning_point": "情绪转折点"
        }
      ],
      "character_performances": [
        {
          "name": "角色名",
          "speech": {
            "content": "语言表现内容",
            "sentence_length": "句式长短",
            "tone": "语气起伏",
            "speed": "语速快慢",
            "catchphrase": "口头禅（如有）",
            "emotional_change": "情绪波动时的语言变化"
          },
          "body_language": {
            "daily_actions": ["日常轻动作1", "日常轻动作2"],
            "intense_reactions": {
              "breathing": "喘息幅度",
              "muscle_tension": "肌肉紧绷表现",
              "sweat": "汗水滴落位置",
              "stiffness": "肢体僵硬表现",
              "rhythm_change": "呼吸节奏变化"
            }
          },
          "clothing": {
            "style": "衣着风格",
            "fabric": "面料质感",
            "color": "颜色",
            "changes": "衣着变化细节"
          }
        }
      ],
      "chapter_function": {
        "foreshadowing": ["伏笔1", "伏笔2"],
        "conflict_push": "冲突推动描述",
        "character_shaping": "角色塑造描述",
        "transition": "过渡功能描述"
      },
      "word_count": 3500
    }
  ]
}
\`\`\`

## 注意事项
1. 每章分析必须详细，不限制字数
2. 重点关联角色语言、肢体动作、剧烈运动衍生反应、衣着及衣着变化
3. 不遗漏关键章节
4. 总输出按章节顺序排列
5. 必须输出有效的JSON格式`

const PLOT_ANALYSIS_PROMPT = `## 任务指令
对小说进行剧情专项深度分析，核心聚焦「整体剧情分析」模块。全程基于原文文本，剔除偶然剧情特例、临时细节，提炼核心剧情逻辑，拒绝主观脑补、冗余赘述、过度解读。最终输出结构化、简洁化的剧情分析报告，为小说续写、剧情梳理提供精准支撑，确保分析内容与原文高度契合，不偏离人设、不违背剧情逻辑。

## 核心分析维度（必写，精准且不冗余，全程贴合原文）

### 一、核心剧情脉络（详细梳理，关联细节）
- 开端：明确故事起点，包含主角初始状态（外貌、衣着、情绪）、初始环境、核心事件触发点
- 发展：梳理剧情推进的关键节点，每个节点需关联角色语言、肢体动作、衣着变化
- 高潮：明确核心矛盾爆发的场景，包含角色的情绪爆发、肢体反应、衣着状态
- 当前进度：明确当前剧情位置，主角状态变化，待解决的核心问题
- 必须包含：每个阶段的角色衣着演变、肢体动作变化、语言风格变化

### 二、核心冲突（分内在、外在，贴合原文，详细分析）
- 内在冲突：
  - 角色内心的挣扎、抉择
  - 必须包含：内心冲突的外在表现（肢体动作、衣着变化、语言变化）
  - 示例：主角内心的挣扎：既想逃避痛苦记忆，又想承担自身责任，常通过攥紧拳头、沉默发呆、衣着褶皱加深等肢体动作体现
- 外在冲突：
  - 角色间矛盾：明确矛盾双方、矛盾起因、矛盾升级过程、当前状态
  - 与环境/命运的对抗：明确对抗对象、对抗方式、对抗结果
  - 必须包含：冲突场景中的肢体动作细节、衣着状态、语言表现

### 三、剧情伏笔与铺垫（详细分析，关联原文）
- 每个伏笔需包含：
  - 伏笔内容：明确伏笔的具体内容
  - 埋设章节：伏笔首次出现的章节
  - 关联细节：伏笔关联的衣着、肢体动作、语言细节
  - 揭示预期：预期揭示的章节或剧情节点
- 示例：
  1. 主角身上的疤痕与配角提及的"旧伤"呼应，疤痕首次出现在第3章，配角提及"旧伤"在第12章
  2. 配角始终佩戴的旧玉佩，暗示与主角的过往羁绊，玉佩细节在第5章首次描写
  3. 主角频繁出现的肢体僵硬，为后续揭示创伤埋下伏笔，首次出现于第2章

### 四、剧情基调与核心主题
- 剧情基调：
  - 明确整体基调（如悬疑感强、温情中带悲凉、热血励志、隐忍克制）
  - 关联具体场景的基调表现
- 核心主题：
  - 明确核心主题（如救赎与成长、亲情与道义、真相与谎言）
  - 必须包含：原文细节佐证（关联角色语言、肢体动作、衣着变化）

### 五、角色成长轨迹（详细分析）
- 主角成长：
  - 初始状态：外貌、衣着、语言习惯、肢体动作特点
  - 关键转折：触发成长的事件、成长过程中的肢体/衣着/语言变化
  - 当前状态：当前的外貌、衣着、语言、肢体特点
- 核心配角成长：
  - 同上，每个配角单独分析

## 固定输出格式（结构化JSON）

\`\`\`json
{
  "plot_overview": {
    "opening": {
      "description": "开端描述",
      "protagonist_state": {
        "appearance": "外貌状态",
        "clothing": "衣着状态",
        "emotion": "情绪状态"
      },
      "environment": "初始环境",
      "trigger_event": "核心事件触发点"
    },
    "development": [
      {
        "stage": "发展阶段1",
        "key_events": ["事件1", "事件2"],
        "character_changes": {
          "clothing": "衣着变化",
          "body_language": "肢体动作变化",
          "speech": "语言变化"
        }
      }
    ],
    "climax": {
      "description": "高潮描述",
      "conflict_scene": {
        "emotion_explosion": "情绪爆发表现",
        "body_reaction": "肢体反应",
        "clothing_state": "衣着状态"
      }
    },
    "current_progress": {
      "position": "当前剧情位置",
      "protagonist_state": "主角当前状态",
      "pending_issues": ["待解决问题1", "待解决问题2"]
    },
    "completion_percentage": 65
  },
  "core_conflicts": {
    "internal": [
      {
        "conflict": "内在冲突描述",
        "external_manifestation": {
          "body_language": "肢体动作表现",
          "clothing_change": "衣着变化",
          "speech_change": "语言变化"
        }
      }
    ],
    "external": [
      {
        "type": "角色间矛盾/环境对抗/命运对抗",
        "parties": ["冲突方1", "冲突方2"],
        "cause": "矛盾起因",
        "escalation": "矛盾升级过程",
        "current_status": "当前状态",
        "scene_details": {
          "body_language": "冲突场景肢体动作",
          "clothing": "冲突场景衣着状态",
          "speech": "冲突场景语言表现"
        }
      }
    ]
  },
  "foreshadowing": [
    {
      "hint": "伏笔内容",
      "first_appearance_chapter": "首次出现章节",
      "related_details": {
        "clothing": "关联衣着细节",
        "body_language": "关联肢体动作",
        "speech": "关联语言"
      },
      "expected_reveal": "预期揭示章节"
    }
  ],
  "tone_and_theme": {
    "tone": ["悬疑", "温情", "悲凉"],
    "tone_evidence": [
      {
        "scene": "具体场景",
        "manifestation": "基调表现"
      }
    ],
    "core_themes": ["救赎与成长", "亲情与道义"],
    "evidence": {
      "detail": "原文细节佐证",
      "related_chapter": "关联章节"
    }
  },
  "character_growth": {
    "protagonist": {
      "initial_state": {
        "appearance": "初始外貌",
        "clothing": "初始衣着",
        "speech": "初始语言习惯",
        "body_language": "初始肢体动作"
      },
      "key_turning_points": [
        {
          "event": "转折事件",
          "changes": {
            "clothing": "衣着变化",
            "body_language": "肢体动作变化",
            "speech": "语言变化"
          }
        }
      ],
      "current_state": {
        "appearance": "当前外貌",
        "clothing": "当前衣着",
        "speech": "当前语言习惯",
        "body_language": "当前肢体动作"
      }
    }
  },
  "continuation_constraints": [
    "禁止偏离主角隐忍内敛的性格",
    "禁止提前揭露未铺垫的伏笔",
    "禁止改变角色核心关系",
    "必须保持角色衣着风格一致性",
    "必须延续角色的肢体动作习惯"
  ]
}
\`\`\`

## 注意事项
1. 全程基于输入文本，不主观脑补、不额外加设定、不偏离剧情逻辑
2. 忽略偶然特例，以主流剧情逻辑、核心人设为唯一标准
3. 所有分析需紧密结合角色的语言、肢体动作、剧烈运动衍生反应、外貌、衣着及衣着变化
4. 必须输出有效的JSON格式`

import { STYLE_ANALYSIS_PROMPT as DETAILED_STYLE_PROMPT } from '../style/style-prompt.js'

const STYLE_ANALYSIS_PROMPT = DETAILED_STYLE_PROMPT

const CONTINUE_PROMPT = `## 任务指令
根据已有小说内容进行续写，保持原文风格、人物性格、剧情逻辑的一致性。

## 续写要求

### 一、风格一致
- 保持原文的叙事视角和语言风格
- 延续原文的节奏和氛围
- 使用相似的修辞手法和表达习惯

### 二、人物一致
- 保持角色性格特征
- 延续角色的语言习惯和行为模式
- 遵循角色关系设定

### 三、剧情连贯
- 承接上文剧情发展
- 遵循已铺垫的伏笔和线索
- 保持剧情逻辑的合理性

### 四、格式要求
- 章节标题格式与原文一致
- 段落划分合理
- 对话格式规范

## 输出要求
直接输出续写的小说内容，不要添加任何解释或说明。`

const REWRITE_PROMPT = `## 任务指令
根据用户要求对小说内容进行改写，在保持核心剧情的同时，按要求调整风格、视角或其他要素。

## 改写要求

### 一、核心保持
- 保持核心剧情走向
- 保持角色基本性格
- 保持关键情节节点

### 二、按要求调整
- 根据用户指定的方向进行改写
- 调整语言风格、叙事视角等
- 优化或精简内容

### 三、质量保证
- 文字流畅自然
- 逻辑清晰连贯
- 避免突兀转折

### 四、格式要求
- 保持原文的章节结构
- 段落划分合理
- 对话格式规范

## 输出要求
直接输出改写后的小说内容，不要添加任何解释或说明。`

const PROMPT_TEMPLATES = {
    ROLE_CARD: {
        id: 'role_card',
        name: '角色卡生成',
        description: '分析小说文本中的角色信息，生成结构化角色卡',
        prompt: ROLE_CARD_PROMPT,
        outputFormat: 'json'
    },
    ROLE_ANALYSIS: {
        id: 'role_analysis',
        name: '角色分析',
        description: '分析小说文本中的角色信息，生成详细角色卡',
        prompt: ROLE_CARD_PROMPT,
        outputFormat: 'json'
    },
    CHAPTER_ANALYSIS: {
        id: 'chapter_analysis',
        name: '单章节剧情分析',
        description: '逐章分析小说内容，提取关键信息',
        prompt: CHAPTER_ANALYSIS_PROMPT,
        outputFormat: 'json'
    },
    PLOT_ANALYSIS: {
        id: 'plot_analysis',
        name: '总剧情分析',
        description: '对小说进行整体剧情深度分析',
        prompt: PLOT_ANALYSIS_PROMPT,
        outputFormat: 'json'
    },
    STYLE_ANALYSIS: {
        id: 'style_analysis',
        name: '文风分析',
        description: '分析小说文本的写作风格，生成文风卡',
        prompt: STYLE_ANALYSIS_PROMPT,
        outputFormat: 'json'
    },
    CONTINUE: {
        id: 'continue',
        name: '续写',
        description: '根据已有内容进行续写',
        prompt: CONTINUE_PROMPT,
        outputFormat: 'text'
    },
    REWRITE: {
        id: 'rewrite',
        name: '改写',
        description: '根据要求对内容进行改写',
        prompt: REWRITE_PROMPT,
        outputFormat: 'text'
    }
}

function getTemplateById(id) {
    return Object.values(PROMPT_TEMPLATES).find(t => t.id === id) || null
}

function getTemplatePrompt(id) {
    const template = getTemplateById(id)
    return template ? template.prompt : ''
}

function getAllTemplates() {
    return Object.values(PROMPT_TEMPLATES)
}

export {
    ROLE_CARD_PROMPT,
    CHAPTER_ANALYSIS_PROMPT,
    PLOT_ANALYSIS_PROMPT,
    STYLE_ANALYSIS_PROMPT,
    CONTINUE_PROMPT,
    REWRITE_PROMPT,
    PROMPT_TEMPLATES,
    getTemplateById,
    getTemplatePrompt,
    getAllTemplates
}
