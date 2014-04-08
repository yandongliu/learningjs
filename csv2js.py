'''
  convert csv file to json objects

  usage: cat csv_file | python csv2js.py > json_file

  note:
   1) 1st line must be header
   2) also remember to remove label from 'features' so it's not used for training
   3) then drag and drop to the drop zone of learningjs page
'''
import sys

header=True
h=[]
data=[]
print 'var trainData=['
lastfs=None
for l in sys.stdin:
  if(header):
    fs = l.strip().split(',')
    h = fs
    header=False
  else:
    fs = l.strip().split(',')
    if lastfs!=None:
      print '{',
      print ','.join([h[idx]+':\''+a+'\'' for idx,a in enumerate(lastfs)]),
      print '},'
    lastfs = fs
print '{',
print ','.join([h[idx]+':\''+a+'\'' for idx,a in enumerate(lastfs)]),
print '}'
print ']'

print 'var features=['
print ','.join(['\''+a+'\'' for a in h])
print ']'

