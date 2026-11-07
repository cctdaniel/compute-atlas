"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { useProgress } from "./preferences";
import { GradientPlayer, type Depth } from "./gradient-player";
import { AtlasArt, NotebookExample } from "./atlas-art";

const depths: { id: Depth; number: string; label: string; adds: string }[] = [
  { id: "intuition", number: "01", label: "Intuition", adds: "Start with the idea. No equations needed." },
  { id: "beginner", number: "02", label: "Step by step", adds: "Follow the numbers through one complete update." },
  { id: "technical", number: "03", label: "The math", adds: "See the exact rule, its assumptions, and its limits." },
];

const sections = [
  { id: "the-problem", number: "01", title: "The question", description: "One model. One wrong prediction." },
  { id: "choose-your-depth", number: "02", title: "Build your understanding", description: "An intuition, a trace, or the math." },
  { id: "experiment", number: "03", title: "Try it yourself", description: "Make a change. See what happens." },
  { id: "predict", number: "04", title: "Check your understanding", description: "Predict before you reveal." },
  { id: "transfer", number: "05", title: "Take the idea further", description: "A new input. The same rule." },
];

function ContentsLinks({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return <nav aria-label="Lesson contents">{sections.map((section) => (
    <a href={`#${section.id}`} key={section.id} aria-current={active === section.id ? "location" : undefined} onClick={onNavigate}>
      <span className="contents-number">{section.number}</span>
      <span>{section.title}<small>{section.description}</small></span>
    </a>
  ))}</nav>;
}

export function Lesson() {
  const contents = useRef<HTMLDetailsElement>(null);
  const [activeSection, setActiveSection] = useState("the-problem");
  const [answer, setAnswer] = useState<string | null>(null);
  const [transfer, setTransfer] = useState(false);
  const { saved, completed, toggleSaved, toggleCompleted, lastStep, lastRate, lastDepth: depth, saveDepth: setDepth, saveExperiment, saveSection, recordVisit, ready } = useProgress();
  useEffect(() => { if (ready) recordVisit(); }, [ready, recordVisit]);
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) { setActiveSection(visible.target.id); saveSection(visible.target.id); }
    }, { rootMargin: "-40% 0px -59% 0px" });
    [...sections.map((section) => section.id), "sources"].forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [ready, saveSection]);
  const isSaved = saved.includes("gradient-descent");
  const isComplete = completed.includes("gradient-descent");

  return <div className="lesson-page page-width">
    <div className="lesson-topline">
      <Link href="/#learning-path" className="text-button"><Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />The learning path</Link>
      <button className={`save-button ${isSaved ? "is-saved" : ""}`} aria-pressed={isSaved} onClick={() => toggleSaved("gradient-descent")}>
        <Icon name="bookmark" size={17} />{isSaved ? "Saved" : "Save lesson"}
      </button>
    </div>

    <header className="lesson-header">
      <div className="eyebrow">AI & ML <span className="header-divider">/</span> THE FOUNDATIONS</div>
      <h1>How machines <em>learn.</em></h1>
      <p>Learn how gradient descent improves a prediction, using one small model you can inspect.</p>
      <div className="lesson-meta">
        <span><Icon name="clock" size={15} />12 min read</span>
        <span><Icon name="chart" size={15} />Interactive lesson</span>
        <span className="pill">No prerequisites</span>
      </div>
    </header>

    <details className="reader-contents" ref={contents}>
      <summary><span>In this lesson <small>5 short sections</small></span><Icon name="chevron" size={16} /></summary>
      <ContentsLinks active={activeSection} onNavigate={() => { if (contents.current) contents.current.open = false; }} />
    </details>

    <div className="lesson-layout">
      <article className="lesson-body" aria-label="Gradient descent explained">
        <div className="learning-goal">
          <p><strong>What you’ll understand</strong>How to calculate one learning step, why it helps, and when a step is too large.</p>
        </div>

        <section className="lesson-section" id="the-problem">
          <span className="section-index">01 / The question</span>
          <h2>How do you teach a number to get better?</h2>
          <p>You have a receipt: <strong>2 notebooks cost $4</strong>. A tiny model knows the quantity but has to learn the price per notebook. It starts by guessing <strong>$1 each</strong>.</p>
          <NotebookExample />
          <p>Our model is one rule: <strong>total = price × quantity</strong>. The price is the adjustable number. In machine learning, we call that number a <strong>weight</strong>.</p>
          <p>At $1 each, the model predicts $2. The receipt says $4. We need a repeatable way to adjust the weight so the prediction gets closer.</p>
          <p>Adjusting a model using known examples is <strong>training</strong>. Using the trained model to make a prediction is <strong>inference</strong>.</p>
          <p className="aside-note">We could divide $4 by 2 here. This small example lets us inspect an update rule that also works with many weights. We assume identical prices, no tax, and no fixed fee (called a bias). Fitting one receipt doesn’t prove a model works on other data.</p>
          <details className="mechanism-map-inline">
            <summary>The mechanism at a glance <Icon name="chevron" size={15} /></summary>
            <MechanismMap />
          </details>
        </section>

        <section id="choose-your-depth" className="depth-section lesson-section">
          <span className="section-index">02 / Build your understanding</span>
          <h2>Choose your way in.</h2>
          <p className="depth-intro">One example, three ways to understand it. Start with intuition, or follow the numbers all the way down.</p>
          <div className="depth-tabs" role="group" aria-label="Explanation depth">
            {depths.map((item) => <button key={item.id} aria-pressed={depth === item.id} className={depth === item.id ? "active" : ""} onClick={() => setDepth(item.id)}>
              <span>{item.number}</span>{item.label}
            </button>)}
          </div>
          <p className="depth-adds">{depths.find((item) => item.id === depth)?.adds}</p>
          <div className="depth-content">
            {depth === "intuition" ? <IntuitionExplanation /> : depth === "beginner" ? <BeginnerExplanation /> : <TechnicalExplanation />}
          </div>
        </section>

        <section id="experiment" className="lesson-section experiment-section">
          <span className="section-index">03 / Try it yourself</span>
          <p className="experiment-intro">Start with a single step. Then change the learning rate and notice what happens to the loss. You can switch explanation depth without losing your place.</p>
          {ready ? <GradientPlayer depth={depth} onStep={saveExperiment} initialStep={lastStep} initialRate={lastRate} /> : <div className="simulation-loading">Preparing your experiment…</div>}
        </section>

        <section className="lesson-section" id="predict">
          <span className="section-index">04 / Check your understanding</span>
          <h2>What if we took one bigger step?</h2>
          <p>Start again with a weight of 1. The gradient is −4, so the update is <strong>new weight = 1 − learning rate × (−4)</strong>. If the learning rate is <strong>0.25</strong>, what is the new weight?</p>
          <p className="question-prompt">Make a prediction, then choose your answer.</p>
          <div className="quiz-options" role="group" aria-label="Choose the new weight">
            {["1.25", "2.00", "4.00"].map((option) => <button key={option} aria-pressed={answer === option} className={answer === option ? answer === "2.00" ? "correct" : "incorrect" : ""} onClick={() => setAnswer(option)}>
              {option}{answer === option && <Icon name={answer === "2.00" ? "check" : "close"} size={17} />}
            </button>)}
          </div>
          {answer && <div className={`quiz-answer ${answer === "2.00" ? "correct-answer" : ""}`} role="status">
            <strong>{answer === "2.00" ? "Exactly. One step to the target." : "Let’s trace the update together."}</strong>
            <p>w′ = 1 − 0.25 × (−4) = <strong>2</strong>. The prediction is now 2 × 2 = 4, so loss is 0.</p>
            <p>This exact landing depends on this particular model and loss rule. A larger learning rate isn’t always better.</p>
          </div>}
        </section>

        <section className="lesson-section transfer-section" id="transfer">
          <span className="section-index">05 / Take the idea further</span>
          <h2>A new input. The same rule?</h2>
          <p>A different receipt shows <strong>3 notebooks costing $6</strong>. Start with the same guessed price of $1 per notebook and learning rate 0.10. Would the first update still give a weight of 1.4?</p>
          <p className="question-prompt">Work it out before revealing the reasoning.</p>
          <button className="text-button" aria-expanded={transfer} aria-controls="transfer-reasoning" onClick={() => setTransfer(!transfer)}>
            {transfer ? "Hide the reasoning" : "Reveal the reasoning"}<Icon name="chevron" size={16} style={{ transform: transfer ? "rotate(90deg)" : "none" }} />
          </button>
          {transfer && <div className="transfer-answer" id="transfer-reasoning">
            <p>Prediction = 3, error = −3, gradient = 3 × (−3) = −9. So w′ = 1 − 0.10 × (−9) = <strong>1.9</strong>, not 1.4.</p>
            <p>The extra notebook changes the gradient, so the adjustment changes too. The update rule stays the same.</p>
            {depth === "technical" && <p>With x = 3, the stable range becomes 0 &lt; α &lt; 2/9. The input scale affects which learning rates converge.</p>}
          </div>}
        </section>

        <section className="takeaway">
          <div>
            <div className="eyebrow">THE IDEA TO TAKE WITH YOU</div>
            <h2>Learning is a loop,<br />not a leap.</h2>
            <p>Make a prediction. Measure the loss. Calculate which way improves it. Adjust a little. Repeat.</p>
            <p>That same loop scales from our single weight to much larger models.</p>
            <button className={`button ${isComplete ? "button-complete" : "button-primary"}`} onClick={() => toggleCompleted("gradient-descent")} aria-pressed={isComplete}>
              <Icon name="check" size={18} />{isComplete ? "Lesson completed" : "Mark as understood"}
            </button>
            <span className="completion-note">{isComplete ? "Marked complete on this device. Tap again to undo." : "Your completion is saved in this browser."}</span>
          </div>
        </section>

        <section className="sources" id="sources">
          <span className="section-index">Further reading</span>
          <h2>Read more about gradient descent.</h2>
          <p>This original worked example moves from visual intuition to a numerical trace, then to the exact rule. These references informed the explanation.</p>
          <a href="https://www.3blue1brown.com/lessons/gradient-descent/" target="_blank" rel="noreferrer">
            <span><small>01 / 3Blue1Brown</small><strong>Gradient descent, how neural networks learn</strong></span><Icon name="arrow" size={18} />
          </a>
          <a href="https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent" target="_blank" rel="noreferrer">
            <span><small>02 / Google Machine Learning Crash Course</small><strong>Linear regression: gradient descent</strong></span><Icon name="arrow" size={18} />
          </a>
        </section>

        <Link href="/#learning-path" className="back-to-path">
          <Icon name="compass" size={23} /><span><small>CONTINUE EXPLORING</small><strong>Back to your learning path</strong></span><Icon name="arrow" size={20} />
        </Link>
      </article>

      <aside className="lesson-toc">
        <div className="eyebrow">IN THIS LESSON</div>
        <ContentsLinks active={activeSection} />
        <a href="#sources" className="toc-sources">Further reading <Icon name="arrow" size={14} /></a>
        <MechanismMap />
      </aside>
    </div>
  </div>;
}

function IntuitionExplanation() {
  return <>
    <h3>Think of a careful walk downhill.</h3>
    <p>Imagine standing on a hillside in fog. You can’t see the whole valley, but you can feel which way the ground slopes. You take a small step downhill, check the slope again, and repeat.</p>
    <p>For our model, the <strong>height is loss</strong>: a number measuring how wrong a prediction is. Your position is the weight. The slope tells you how loss changes as the weight changes.</p>
    <figure className="loss-landscape"><AtlasArt /><figcaption>This is our model’s actual loss curve. Moving from weight 1 to 1.4 lowers the loss from 2 to 0.72. At weight 2, the predicted total matches the receipt.</figcaption></figure>
    <p>The <strong>gradient</strong> tells us the direction and steepness of the slope. We go the opposite way to move downhill. A <strong>learning rate</strong> controls how large an adjustment we make.</p>
    <div className="concept-callout">
      <span>THE CONNECTION</span>
      <p>Feel the slope. Choose the downhill direction. Take a small step.</p>
      <p><strong>Measure the error. Calculate a gradient. Update the weight.</strong></p>
    </div>
    <p>This repeated adjustment is <strong>gradient descent</strong>. In our example, moving downhill means raising the guessed price toward $2 per notebook.</p>
    <p className="aside-note">Where the analogy stops: a model doesn’t physically walk or understand its mistakes. We calculate a derivative: how much the loss changes when we nudge the weight. Complex loss surfaces can also have many valleys, unlike this simple example.</p>
  </>;
}

function BeginnerExplanation() {
  return <>
    <h3>One update, with all the numbers.</h3>
    <p>Quantity is our <strong>input</strong> (2), the receipt total is our <strong>target</strong> (4), and the guessed price is our <strong>weight</strong> (1).</p>
    <p>First, calculate the <strong>error</strong>: prediction minus target. A negative error means our guess was too low.</p>
    <p>To measure how far off we are in either direction, square the error and divide by two. We call this number <strong>loss</strong>. It’s a score, not a dollar total. Zero means an exact match.</p>
    <p>The gradient measures how loss changes when we nudge the weight.</p>
    <ol className="worked-steps">
      <li><span>Predict</span><p>1 × 2 = <strong>2</strong>. Target = 4, so error = 2 − 4 = <strong>−2</strong>.</p></li>
      <li><span>Measure</span><p>Loss = ½ × (−2)² = <strong>2</strong>. The gradient is input × error = 2 × (−2) = <strong>−4</strong>.</p></li>
      <li><span>Adjust</span><p>At learning rate 0.10, new weight = 1 − 0.10 × (−4) = <strong>1.4</strong>. Subtracting a negative increases the weight.</p></li>
      <li><span>Check</span><p>New prediction = 1.4 × 2 = <strong>2.8</strong>. New loss = ½ × (2.8 − 4)² = <strong>0.72</strong>. The loss fell from 2 to 0.72.</p></li>
    </ol>
    <p>Repeat from weight 1.4. The next gradient is −2.4, the next weight is 1.64, and the next loss is 0.2592.</p>
    <p className="aside-note">Nothing remembers the rounded display values. The calculation keeps full precision.</p>
  </>;
}

function TechnicalExplanation() {
  return <>
    <h3>The rule underneath the intuition.</h3>
    <p>Let x = 2 be the notebook quantity, y = 4 the receipt total, and w the estimated price per notebook. The model has one parameter (w), and its bias is fixed at zero. We write its prediction as ŷ (“y hat”) and its loss as L.</p>
    <p>We use half-squared error; the ½ cancels the factor of 2 when differentiating. The derivative ∂L/∂w measures the local sensitivity of loss to the weight. The learning rate α scales the update; w′ means the new weight.</p>
    <div className="math-block">
      <span>Prediction</span><code>ŷ = wx</code>
      <span>Loss</span><code>L(w) = ½(wx − y)²</code>
      <span>Gradient</span><code>∂L/∂w = x(wx − y) = 4w − 8</code>
      <span>Update</span><code>w′ = w − α · ∂L/∂w</code>
    </div>
    <p>At w = 1, the gradient is −4. With α = 0.10, w′ = 1.4 and L(w′) = 0.72. The minimizing weight is w* = 2.</p>
    <p>Subtract it from the update rule to see what happens to the weight’s error:</p>
    <div className="single-equation"><code>w′ − 2 = (1 − 4α)(w − 2)</code></div>
    <p>Convergence (approaching the minimizing weight) requires |1 − 4α| &lt; 1, so <strong>0 &lt; α &lt; 0.5</strong>.</p>
    <p>At α = 0.25 the optimum is reached in one update. At 0.5 the error oscillates without shrinking. Above 0.5 it grows.</p>
    <p className="aside-note">These thresholds belong to this particular quadratic, input scale, and loss convention. Real datasets and models have different curvature. Reducing training loss on one example also says nothing about performance on unseen data.</p>
  </>;
}

function MechanismMap() {
  return <div className="toc-map">
    <strong>The mechanism, mapped.</strong>
    <dl>
      <dt>Who</dt><dd>One model, one weight</dd>
      <dt>What</dt><dd>Reduce prediction error</dd>
      <dt>Why</dt><dd>Improve the fit</dd>
      <dt>When</dt><dd>During training</dd>
      <dt>Where</dt><dd>The parameter update</dd>
      <dt>How</dt><dd>Follow the negative gradient</dd>
    </dl>
  </div>;
}
