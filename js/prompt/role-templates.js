const ROLE_ANALYSIS_PROMPT = `## 任务指令
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

export { ROLE_ANALYSIS_PROMPT }
