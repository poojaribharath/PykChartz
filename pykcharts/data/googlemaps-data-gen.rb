def get_lon #between -180,180
  r = -180..180
  r = r.to_a
  index = (rand() * 360).floor
  return r[index].to_s
end

def get_lat #between -90,90
  r = -90..90
  r = r.to_a
  index = (rand() * 180).floor
  return r[index].to_s
end

def get_marker
  markers = ["i1.png", "i2.png", "i3.png"]
  marker = markers[(rand()*3).floor]
  return "/pykcharts/res/img/" + marker
end

puts "["

50.times do |n|
  puts " {"
  puts '  "latitude": ' + get_lat + ','
  puts '  "longitude": ' + get_lon + ','
  puts '  "count": ' + (rand() * 100).floor.to_s + ','
  puts '  "tooltip": "This tooltip is a lie",'
  puts '  "marker": "' + get_marker + '"'
  if n == 49
    puts " }"
  else
    puts " },"
  end
end


puts "]"
