#!/usr/bin/env ruby

Dir.chdir(File.dirname(__FILE__))

`echo '{"data":{' > data.json`

$stdout.sync = true

Dir.entries('test').each do |path|
	next if path=='.' or path=='..'
	user, repo, _=path.split(/\./, 3)
	puts `git clone https://github.com/#{user}/#{repo} --depth=1 -b master`
	Dir.chdir("./#{repo}") do
		`sh ../test/#{path}`
	end
	`echo '"#{user}/#{repo}":{' >> data.json`
	has_pre_script=File.exist?("./aheui.pre.sh")
	has_post_script=File.exist?("./aheui.post.sh")
	Dir.glob("snippets/**/*.out") do |testpath|
		testpath=testpath.gsub(/\.out$/, '')
		inputpath="#{testpath}.in"
		`sh ./aheui.pre.sh #{testpath}.aheui` if has_pre_script
		output=`timeout 2m /usr/bin/time --format="%S %U" --output=time.tmp ./aheui #{testpath}.aheui #{"< #{inputpath}" if File.exist?(inputpath)}`
		exitcode="#{$?.exitstatus}"
		`sh ./aheui.post.sh #{testpath}.aheui` if has_post_script
		output=output.strip
		timestr=`cat time.tmp`
		tp=testpath.gsub(/^snippets\//, '')
		if timestr==''
			puts "Terminated #{tp}"
			`echo '"#{tp}": true,' >> data.json`
		elsif (File.exist?("#{testpath}.exitcode") and `cat #{testpath}.exitcode`.strip!=exitcode) or `cat #{testpath}.out`.strip!=output
			puts "Fail #{tp}"
			`echo '"#{tp}": false,' >> data.json`
		else
			time=timestr.scan(/\d+\.\d+ \d+\.\d+/)[0].split(/ /, 2).map(&:to_f).reduce(&:+)
			puts "Pass #{tp} #{time}s"
			`echo '"#{tp}": #{time},' >> data.json`
		end
	end
	`echo '"_":null},' >> data.json`
	`rm ./#{repo} -rf`
	`rm ./aheui` if (File.exist?("./aheui") || File.symlink?("./aheui"))
	`rm ./aheui.pre.sh` if has_pre_script
	`rm ./aheui.post.sh` if has_post_script
	`rm time.tmp`
end

`echo '"_":"#{`date -Iseconds`.strip}"}}' >> data.json`
