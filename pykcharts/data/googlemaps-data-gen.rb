def get_lon #between -180,180
  r = 81..89
  r = r.to_a
  index = (rand() * 8).floor
  return r[index].to_s
end

def get_lat #between -90,90
  
  r = 24..30
  r = r.to_a
  index = (rand() * 6).floor
  return r[index].to_s
end

def get_marker
  markers = ["i1.png"]
  marker = markers[(rand()*1).floor]
  return "/" + marker
end

puts "["

200.times do |n|
  puts " {"
  puts '  "latitude": ' + get_lat + ','
  puts '  "longitude": ' + get_lon + ','
  puts '  "count": ' + (rand() * 100).floor.to_s + ','
  puts '  "tooltip": "This tooltip is a lie",'
  puts '  "marker": "' + get_marker + '"'
  if n == 199
    puts " }"
  else
    puts " },"
  end
end


puts "]"