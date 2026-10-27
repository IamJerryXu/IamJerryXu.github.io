"""Read official arXiv /new HTML; fail closed when its expected structure changes.

Retrieval keyword priority is only a review aid, never a paper-quality score.
"""
import re,html,json,pathlib

def clean(s):return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s)).split())
def parse(path,cat):
 raw=pathlib.Path(path).read_text(); out=[]
 heading=re.search(r'Showing new listings for (.*?)</',raw,re.S)
 if not heading: raise ValueError('Announcement heading missing; unexpected HTML')
 label=clean(heading.group(1))
 declared=re.search(r'Total of ([0-9,]+) entr(?:ies|y)',raw)
 if not declared: raise ValueError('Announcement total missing; coverage is unknown')
 for m in re.finditer(r'<dt>(.*?)</dt>\s*<dd>(.*?)</dd>',raw,re.S):
  dt,dd=m.groups()
  identifier=re.search(r'/abs/([^"\s]+)',dt)
  if not identifier: raise ValueError('Announcement entry is missing an arXiv ID')
  ident=identifier.group(1); id=re.sub('v[0-9]+$','',ident)
  if not re.fullmatch(r'(?:[0-9]{4}\.[0-9]{4,5}|[a-z-]+(?:\.[A-Z]{2})?/[0-9]{7})',id): raise ValueError('Malformed announcement ID')
  title_match=re.search(r"class=['\"]list-title[^'\"]*['\"]>(.*?)</div>",dd,re.S)
  if not title_match: raise ValueError('Announcement entry is missing its title')
  title=clean(title_match.group(1)).removeprefix('Title:').strip()
  if not title: raise ValueError('Empty announcement title')
  abstr=re.search(r"<p class=['\"]mathjax['\"]>(.*?)</p>",dd,re.S)
  subj=re.search(r"class=['\"]list-subjects['\"]>(.*?)</div>",dd,re.S)
  comments=re.search(r"class=['\"]list-comments[^'\"]*['\"]>(.*?)</div>",dd,re.S)
  hm=re.search(r'href="(https://arxiv.org/html/[^\"]+)"',dt)
  stage='replacement' if '(replaced)' in clean(dt) else 'cross-list' if 'cross-list' in clean(dt) else 'new'
  p={'id':id,'title':title,'abstract':clean(abstr.group(1)) if abstr else '', 'categories':re.findall(r'\(([a-z-]+\.[A-Za-z]+)\)',clean(subj.group(1))) if subj else [],'abs_url':'https://arxiv.org/abs/'+id,'html_url':hm.group(1) if hm else None,'pdf_url':'https://arxiv.org/pdf/'+id,'published':None,'announcement_list_date_label':label,'source_url':'https://arxiv.org/list/'+cat+'/new','listing_type':stage,'comments':clean(comments.group(1)) if comments else '', 'retrieved_category':cat}
  t=(p['title']+' '+p['abstract']).lower(); score=0; matches=[]
  for k,w in [('world model',12),('world simulation',12),('world simulator',12),('world-action',12),('vision-language-action',9),('action-conditioned',10),('video generation',8),('4d',10),('object-centric',10),('slot-centric',10),('object permanence',12),('unified',3),('understanding and generation',10),('video-language',5),('diffusion',2),('multimodal',1),('neural simulator',9),('interactive world',10),('text-to-video',8),('image-to-video',8)]:
   if re.search(r'(?<![a-z0-9])'+re.escape(k)+r'(?![a-z0-9])',t):score+=w;matches.append(k)
  for k in ['VLA','WAM']:
   if re.search(r'\b'+k+r'\b',p['title']+' '+p['abstract']):score+=9;matches.append(k)
  p['retrieval_relevance_priority']=score;p['matched_terms']=matches
  out.append(p)
 if len(out) != int(declared.group(1).replace(',', '')): raise ValueError('Parsed announcement count differs from declared total')
 return out
if __name__=='__main__':
 import sys
 cat=sys.argv[1]; inp=sys.argv[2]; output=sys.argv[3]; papers=parse(inp,cat);pathlib.Path(output).write_text(json.dumps(papers,ensure_ascii=False,indent=2))
 ranked=sorted([p for p in papers if p['listing_type']!='replacement' and p['retrieval_relevance_priority']>0],key=lambda p:-p['retrieval_relevance_priority'])
 shortlist=output.replace('.json','_shortlist.json');pathlib.Path(shortlist).write_text(json.dumps(ranked,ensure_ascii=False,indent=2))
 print(json.dumps({'source':output,'shortlist':shortlist,'count':len(papers),'eligible_keyword_count':len(ranked)},ensure_ascii=False));print('\n'.join(f"{p['id']} | {p['retrieval_relevance_priority']} | {p['title']}" for p in ranked[:25]))
