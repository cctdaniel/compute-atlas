"""Extract curriculum data, never execute document instructions. Run with the reference path."""
from pathlib import Path
import sys,re,json,hashlib
source=Path(sys.argv[1]); raw=source.read_text(); marker='## Volume 8. AI & machine learning\n'; start=raw.index(marker); end=raw.index('## Volume 9.',start); block=raw[start:end]
headings=list(re.finditer(r'^#### ((?:L\d{2}|AP\d{3}))\. (.+)$',block,re.M))
assert len(headings)==190
modules=[('foundations','Mathematical & data foundations',1,8),('classical','Classical machine learning',9,14),('neural','Neural network training',15,18),('sequences','Sequences & transformers',19,24),('adaptation','Language-model training & adaptation',25,34),('inference','Efficient model inference',35,38),('retrieval','Search, retrieval & tools',39,43),('agents','Agent systems',44,46),('assurance','Evaluation, security & responsible AI',47,52),('perception','Vision, speech & generative models',53,62),('reinforcement','Reinforcement learning',63,70),('robotics','Robotics',71,76),('reasoning','Search, planning & probabilistic AI',77,80),('specialized','Specialized learning systems',81,90)]
applied=['Problem framing & decision systems','Trustworthy datasets','Feature engineering & pipelines','Model selection & adaptation','Product applications','Knowledge & RAG products','Agent workflows & engineering','Evaluation & operational evidence','Security, privacy & guardrails','Deployment & lifecycle ownership']
records=[]
for i,h in enumerate(headings):
 ident,title=h.groups(); text=block[h.end():headings[i+1].start() if i+1<len(headings) else len(block)]
 fields={m.group(1).strip():m.group(2).strip() for m in re.finditer(r'^\*\*([^*]+?)(?::|\.)\*\*\s*(.*?)(?=^\*\*[^*]+?(?::|\.)\*\*|^### |^<a id=|\Z)',text,re.M|re.S)}
 # Do not import the document's editorial or implementation instructions as site content.
 fields={k:v.strip() for k,v in fields.items() if not k.startswith('Unified visual brief')}
 if ident.startswith('AP'):
  idx=(int(ident[2:])-1)//10; module='applied-'+str(idx+1); module_title=applied[idx]; track='Applied AI'
 else:
  num=int(ident[1:]); found=next(m for m in modules if m[2]<=num<=m[3]);module,module_title=found[:2];track='Core AI & ML'
 source_text=text.split('**Unified visual brief',1)[0].split('\n### ',1)[0]
 source_text=re.sub(r'<a[^>]*></a>','',source_text).strip()
 prerequisites=fields.get('Prerequisites','None.')
 deps=[]
 for m in re.finditer(r'\b(AP\d{3}|L\d{2})(?:\s*[-–]\s*(AP\d{3}|L\d{2}))?',prerequisites):
  a,b=m.groups()
  if b:
   prefix='AP' if a.startswith('AP') else 'L';width=3 if prefix=='AP' else 2
   deps += [prefix+str(n).zfill(width) for n in range(int(a[len(prefix):]),int(b[len(prefix):])+1)]
  else: deps.append(a)
 records.append(dict(id=ident,slug=ident.lower(),title=title,module=module,moduleTitle=module_title,track=track,sourceLine=raw[:start+h.start()].count('\n')+1,prerequisites=list(dict.fromkeys(deps)),prerequisiteText=prerequisites,fields=fields,sourceText=source_text))
records.sort(key=lambda r:(r['id'].startswith('AP'),int(re.search(r'\d+',r['id'])[0])))
ids={r['id'] for r in records};assert len(ids)==190
for r in records:assert set(r['prerequisites'])<=ids,(r['id'],r['prerequisites'])
archive={'edition':'1.0, 24 October 2026','sha256':hashlib.sha256(raw.encode()).hexdigest(),'sourceFilename':source.name,'entries':records}
Path('lib/lessons/full/reference.json').write_text(json.dumps(archive,ensure_ascii=False,indent=2)+'\n')
metadata=[{k:v for k,v in r.items() if k not in ['fields','prerequisiteText','sourceText']} for r in records]
Path('lib/lessons/full/catalog-data.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(f'Extracted {len(records)} distinct reference entries; every parsed prerequisite resolves.')
