# 来源
OpenAI《Prompting GPT-6.2 in Codex》，learn.chatgpt.com/guides/prompting-gpt-6-2-astra，11-18 抓取（.md 版原文如下）

# Prompting GPT-6.2 in Codex

> For the complete documentation index, see [llms.txt](https://learn.chatgpt.com/llms.txt). Markdown versions of documentation pages are available by appending `.md` to the page URL.

Compared with GPT-6 Astra, GPT-6.2 Astra often gives you a first pass that’s closer to something you’d be happy to use. Its code is easier to read and review, and its writing gets to the point sooner. Its visual work is richer, too. On a slide, the layout draws your eye to the comparison that matters. In a 3D scene, details like texture and lighting give the work more character.

These prompting techniques apply across the GPT-6.2 model family, including GPT-6.2 Astra and GPT-6.2 Sol. Describe what you need the way you’d ask a colleague who knows the project, then tell Codex **what you’ll look for when you review the work**. If an icon needs to be recognizable in a 24-pixel toolbar, say so. Codex can pick up the style from the existing icons and work out how much detail will still read at that size.

## Match reasoning effort to the task

Higher reasoning effort can help the model stick with a long-running task through the final checks, even when the answer you need is only a few lines. Tell it what counts as finished and where you want it to be exhaustive. If the team needs a recommendation, that might mean following a promising lead far enough to test it against competing explanations.

Choose [reasoning effort](https://learn.chatgpt.com/docs/models?surface=app#app-pick-a-reasoning-effort) based on the depth of the investigation. A quick survey can use **Medium**. Tracing even one suspected cause across several systems can warrant **High**. Consider **Extra High** when several causes may interact and the investigation needs to account for each one.

## Use subagents for parallel work

When a task has several parts that can move ahead independently, tell Codex to [**use subagents as needed**](https://learn.chatgpt.com/docs/agent-configuration/subagents#triggering-subagent-workflows). That gives Codex permission to decide when parallel work will help and how to divide the task.

If the same kind of work comes up regularly, put that instruction in the relevant [skill](https://learn.chatgpt.com/docs/build-skills) or `AGENTS.md` and say when it applies. For a research skill, for example, it might apply to requests with several independent questions.

With [**Ultra**](https://learn.chatgpt.com/docs/models?surface=app#app-know-when-to-use-max-or-ultra), Codex decides on its own when to bring in subagents. Save it for especially ambitious work that splits cleanly, such as an open-ended research project with several questions that each warrant a deep investigation. Each agent can keep its own working context as it follows one of those questions.

## Give Codex a visual reference and room to iterate

When you have a particular look in mind, a reference image can show how the shapes fit together, which colors stand out, and where the eye should go first. Share one from your design software or ask Codex to create one with [GPT Image](https://learn.chatgpt.com/docs/image-generation#generate-or-edit-an-image). Once the reference captures the look you want, ask it to build the asset, render it, and refine it against the reference.

Have Codex review the result **at the size people will actually see it**. Details that look good in a large render can disappear in the finished product. If the result is interactive, ask it to try the actions it’s meant to support.

The [SVG &amp; 3D Design plugin](https://chatgpt.com/plugins/Plugin_13c5903473e081919917a1070fad1dd1) includes a skill that guides Codex through this process for editable illustrations and 3D models.

## Keep your `AGENTS.md` lean

Use [`AGENTS.md`](https://learn.chatgpt.com/docs/agent-configuration/agents-md) for project requirements and conventions that Codex can’t infer from the code, tests, or docs. Include a workflow when the project depends on it. Leave routine decisions about how to do the work to Codex.

Each task in [Codex Cloud](https://learn.chatgpt.com/docs/environments/cloud-environments#start-a-task-in-codex-cloud) has a virtual machine to itself. If you keep using your computer while Codex works, use your personal `~/.codex/AGENTS.md` to steer it toward tools that let you carry on with your work. For a quick email lookup, for example, encourage Codex to use an available mail connector so your active app keeps focus.

When several agents share the machine, ask each to consider how many builds or tests it needs to run at once and to leave CPU and memory available for other work where possible. Give a demanding job room to use the full machine when it needs it. When wrapping up, have each agent stop the background jobs it started and remove the temporary files it created once they’re no longer needed.