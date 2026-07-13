import { Card, Flex, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { Link as ExternalLink } from 'shared-ui';

const { Title, Paragraph, Text } = Typography;

interface Stage {
  title: string;
  path?: string;
  inferencePath?: string;
  adds: string;
  blurb: string;
}

/**
 * The curriculum, one card per rung. Each stage names the ONE idea it adds over
 * the previous — the ladder this app climbs toward a GPT (and toward reading
 * nanoGPT's model.py line by line).
 */
const STAGES: Stage[] = [
  {
    title: '1 · Bigram (scalar)',
    path: '/bigram/training/scalar',
    inferencePath: '/bigram/inference/scalar',
    adds: 'the training loop',
    blurb:
      'A free V×V lookup table: row a holds the logits for what follows token a. Watch softmax, cross-entropy, the p − y gradient, and one SGD nudge per step — the entire mechanics of training with no model in the way.',
  },
  {
    title: '2 · Bigram (vector)',
    path: '/bigram/training/vector/2d',
    inferencePath: '/bigram/inference/vector/2d',
    adds: 'embeddings',
    blurb:
      'The table factorised into vectors: logit = eₐ·u_b. Tokens become points in space, the dot product becomes the score, and the same p − y gradient now flows into two matrices. This alignment-as-score is the seed of attention’s QKᵀ.',
  },
  {
    title: '3 · MLP for NLP',
    path: '/mlp/training',
    inferencePath: '/mlp/inference',
    adds: 'context + a hidden layer',
    blurb:
      'The Bengio language model: embed N previous tokens, concatenate, push through a tanh hidden layer and an output projection. Backprop now chains through layers — the multi-layer perceptron a transformer block generalises.',
  },
  {
    title: '4 · RNN',
    path: '/rnn/training/vector',
    inferencePath: '/rnn/inference',
    adds: 'recurrence (unbounded context)',
    blurb:
      'Read the context one token at a time, folding each into a running hidden state with the SAME weights each step — memory of any length from a fixed parameter count, trained by backprop through time.',
  },
  {
    title: '5 · Attention',
    adds: 'content-based context',
    blurb:
      'Coming next: Q·Kᵀ scores decide which previous tokens matter, generalising stage 2’s dot product from “the one previous token” to “any of them, weighted”. From there: residuals + LayerNorm, the block stack, and you are reading nanoGPT’s model.py.',
  },
];

export function LandingPage() {
  return (
    <Typography style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2}>LLM trainer</Title>
      <Paragraph>
        An interactive ladder from a lookup table to a GPT, one idea per rung. Every stage shows the
        <Text strong> whole</Text> computation — every weight, logit, probability, gradient and update,
        with nothing hidden — so each number on screen can be recomputed from the others. Use the
        floating <Text strong>training controls</Text> (bottom right, or press <Text code>n</Text>) to
        step; the <Text strong>math console</Text> runs any panel row as real JavaScript and shows the
        PyTorch line you’d write in <ExternalLink href="https://github.com/karpathy/nanoGPT">nanoGPT</ExternalLink>.
      </Paragraph>
      <Paragraph type="secondary">
        The loss panel plots cross-entropy against two reference lines: <Text code>ln V</Text> (random
        guessing — where every run starts) and the corpus’s entropy floor (where every run must stop:
        the corpora are ambiguous, so 0 loss is impossible). Converging means closing that gap.
      </Paragraph>

      <Flex vertical gap={12}>
        {STAGES.map((s) => (
          <Card key={s.title} size="small">
            <Flex align="baseline" gap={8} wrap>
              {s.path ? (
                <Link to={s.path}>
                  <Text strong>{s.title}</Text>
                </Link>
              ) : (
                <Text strong type="secondary">{s.title}</Text>
              )}
              <Tag color={s.path ? 'blue' : 'default'}>adds: {s.adds}</Tag>
              {s.path && <Link to={s.path}>training</Link>}
              {s.inferencePath && <Link to={s.inferencePath}>inference</Link>}
            </Flex>
            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>{s.blurb}</Paragraph>
          </Card>
        ))}
      </Flex>

      <Paragraph style={{ marginTop: 16 }}>
        When two stages feel interchangeable, the <Link to="/compare">model comparison</Link> trains
        all of them on the same corpus and lines up parameters, converged loss, and each one’s floor —
        the scaling-laws mindset at a size you can audit by hand.
      </Paragraph>
    </Typography>
  );
}
