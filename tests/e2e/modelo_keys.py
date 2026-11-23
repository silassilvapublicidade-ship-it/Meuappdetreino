import re, unicodedata
def chave(s):
    s = unicodedata.normalize('NFD', str(s)); s = ''.join(c for c in s if not ('̀' <= c <= 'ͯ')).lower()
    s = re.sub(r'\(.*?\)', '', s); s = re.sub(r'[^a-z0-9]+', '-', s); return s.strip('-')
