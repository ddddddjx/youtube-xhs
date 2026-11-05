# A framework for determining when AI can make decisions

**Source:** [MIT Sloan Ideas Made to Matter](https://mitsloan.mit.edu/ideas-made-to-matter/a-framework-determining-when-ai-can-make-decisions)  
**Author:** Beth Stackpole  
**Date:** September 22, 2026  
**Read time:** 5 minute read  

**Credit:** Igor Link / Shutterstock

---

## What you need to know

- Modern enterprises face the daunting challenge of determining what tasks artificial intelligence can safely perform without human oversight.
- The AI Decision Matrix can help business leaders assess ambiguity and risk when granting decision rights to humans and AI.
- Routine decisions, which have low ambiguity and low risk, are strong candidates for automation, whereas strategic decisions, which have high ambiguity and high risk, need a strong human lead. Human oversight remains important across all categories of decisions.

---

What tasks should artificial intelligence be trusted with, and when should humans remain involved? Designing those decision rights is one of the defining challenges companies face in the AI era.

Researchers from the [MIT Center for Information Systems Research](https://cisr.mit.edu/) have created a framework that can help. Using the **AI Decision Matrix**, business leaders can determine how humans and autonomous AI agents should participate in decision-making based on two dimensions: **ambiguity** and **risk**.

[Ina Sebastian](https://mitsloan.mit.edu/faculty/directory/ina-maria-sebastian), [Peter Weill](https://mitsloan.mit.edu/faculty/directory/peter-weill), [Thomas Haskamp](https://www.wi.uni-muenster.de/department/bpm/people/thomas-haskamp), and [Jan vom Brocke](https://janvombrocke.com) developed the matrix after conducting interviews with 30 executives. It’s based on the premise that not all decisions are equal: Some are predictable and low risk, while others are ambiguous and consequential.

> “This requires different approaches to automation and oversight,” the researchers write in a recent research briefing. “The same AI capability can be safe in one context and risky in another.”

---

## Dimensions and steps involved in decision-making

The AI Decision Matrix considers two dimensions of decision-making:

- **Ambiguity**, which describes how clearly data determines the answer and to what extent people agree on it. Low-ambiguity decisions are repeatable and predictable, while high-ambiguity decisions allow for multiple interpretations.
- **Risk** refers to the consequences of getting a decision wrong. Low-risk decisions have little impact if they’re wrong and can be easily reversed. High-risk decisions can have significant financial, operational, or reputational impacts if they’re wrong. They are also harder to course-correct.

Making a decision also involves three components:

1. **Framing**, which defines the problem, assumptions, stakeholders, constraints, and criteria for success.
2. **Acting**, which is the process of gathering information, evaluating proposed options, recommending and authorizing actions, and executing approved steps.
3. **Learning**, which is when outcomes are monitored and analyzed, there’s accountability for outcomes, and the decision system is updated over time.

---

## Fine-tuning human and AI interactions

Considering both high and low levels of ambiguity and risk results in a matrix of four decision types. Each decision type suggests a different role for AI in the three components of decision-making. Companies should assign decision-making activities to humans and AI accordingly while maintaining human oversight across all of them.

The researchers used **One New Zealand**, a telecommunications provider with more than 50 AI agents in operation as of early 2026, to illustrate how decision rights can be designed.

### Routine decisions (low ambiguity, low risk)

Routine decisions are well defined and will have limited negative consequences if the wrong choice is made, which makes them strong candidates for automation. Companies can codify framing in advance and automate the action and learning aspects of the decision process. Humans should remain closely involved while confidence in agent performance builds.

**Example:** One New Zealand developed a process for creating audience segments for targeted marketing campaigns. An AI agent translates marketer requests into SQL queries, reducing time spent on segmentation by 60%. The marketing team then reviews the AI-generated segmentation plan before launch, and the AI is granted more autonomy as confidence builds in its abilities.

### Consequential decisions (low ambiguity, high risk)

These are well-defined decisions where potential errors can have significant negative consequences. Here, it’s important to balance automation and human intervention. Humans should continue to monitor execution, manage exceptions, and focus on continuous learning.

**Example:** One New Zealand is using AI agents in customer service to facilitate plan upgrades and to support ticket resolution. Business leaders established the company’s risk tolerance to guide what’s acceptable for automation. For example, inaccurate pricing information was deemed a nonnegotiable constraint, so all decisions related to pricing require a human in the loop. Because the company focuses on continuous learning, agents are introduced gradually, and outcomes are validated before agents are released at scale.

### Exploratory decisions (high ambiguity, low risk)

This class of decisions involves interpretation, creativity, or uncertainty, but errors will have limited consequences. Framing can evolve through human and AI interaction, with humans overseeing actions and continuous learning. Governance must be a priority as experimentation leads to higher-risk use cases.

**Example:** One New Zealand’s marketing team employs agents for content creation tasks, maintaining humans in the loop to help frame goals and learn from customer responses. The team is now using what they have learned to develop agent-led, end-to-end autonomous marketing campaigns. The benefits: AI expands the team’s options and accelerates experimentation while human workers remain on hand to revise mistakes before they can have a major impact.

### Strategic decisions (high ambiguity, high risk)

These decisions involve both uncertainty and significant potential consequences, which means that they require a great deal of human leadership and oversight. People need to take the lead in the framing and learning processes while AI facilitates action.

**Example:** One New Zealand uses automation to optimize its network and improve resilience in the event of power outages. Fifteen task-based agents analyze network data. A set of orchestration agents manages those task-based agents while also providing data and analysis to support human decision-making. Actual decisions remain human-led because they involve trade-offs between service reliability, customer experience, cost, and infrastructure priorities.

---

## Best practices for designing decision rights

Several steps that One New Zealand has taken to facilitate decision rights design offer guidance for other companies. Among them:

- **Make organizational adjustments.** One New Zealand empowered business units with responsibility for framing each AI use case to ensure that agents are anchored in business need, value, and domain expertise. This also ensures that decision rights are developed and applied consistently.

- **Create an AI center of excellence.** The company’s center of excellence for AI and data has ownership of data foundations, architecture, and delivery. As part of its work, the center has established a unified data platform for structured and unstructured data; a horizontal AI orchestration layer to coordinate across agentic platforms; a responsible AI use policy; and an iterative rollout to support aligned decision-making.

- **Ensure continuous agent management.** Ongoing agent management is crucial to reducing risk. At One New Zealand, deployed AI agents must have a named human agent owner to ensure accountability for outcomes and learning. Human owners are responsible for monitoring performance, refining data, testing accuracy, and improving agents over time.

- **Manage AI as a portfolio of business decisions.** As AI is embedded in core processes, leaders need to look beyond individual use cases and consider the business decision that the AI implementation affects. Decision rights for routine and consequential decisions can deliver near-term efficiency gains and help with scale, while exploratory and strategic decisions can unlock longer-term value through innovation and better judgment.

> “Companies that get this right will move faster, reduce risk and build trust in how they use AI,” the authors write. “The important shift is from asking where AI can be used to manage the business decisions it shapes.”

---

## Original Research

**Full research briefing:** [Designing Decision Rights for AI](https://cisr.mit.edu/publication/2026_0601_AIDecisionMatrix_SebastianWeillHaskampVomBrocke)

**Authors:** Ina M. Sebastian, Peter Weill, Thomas Haskamp, and Jan vom Brocke  
**Published:** June 18, 2026  
**DSpace link:** https://dspace.mit.edu/handle/1721.1/175016

### Abstract

One of the biggest challenges companies face today is designing decision rights between humans and AI. For example, should AI be used in hiring, and if so, for which tasks? Should AI run marketing campaigns end to end, or augment human judgment? We identified two key dimensions—ambiguity and risk—that help determine how humans and AI that can complete tasks autonomously should share decisions. By mapping decisions across these dimensions, companies make explicit what stakes they’re willing to accept and who bears the consequences. As business decisions vary in ambiguity and risk, leaders need to adjust how AI participates in three activities: framing decisions, acting on them, and learning from the outcomes.

---

*Extracted from MIT Sloan Ideas Made to Matter on November 5, 2026.*
