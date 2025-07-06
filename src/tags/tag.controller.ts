import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { TagService } from "./tag.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('tag')
export class TagController {

  constructor(
    private readonly tagService: TagService,
  ) {
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-tag')
  createTag(@Body() tag: CreateTagDto) {
    return this.tagService.createTag(tag);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-tag')
  updateTag(@Body() tag: UpdateTagDto) {
    return this.tagService.updateTag(tag);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete-tag/:identifier')
  deleteTag(@Param('identifier') identifier: number | string) {
    return this.tagService.deleteTag(identifier);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-group')
  createGroup(@Body() dto: CreateGroupDto) {
    return this.tagService.createGroup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-group')
  updateGroup(@Body() dto: UpdateGroupDto) {
    return this.tagService.updateGroup(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete-group/:identifier')
  deleteGroup(@Param('identifier') identifier: number | string) {
    return this.tagService.deleteGroup(identifier)
  }

  @Get('/user-filters')
  getAllForFilter() {
    return this.tagService.getAllUserTags();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/all')
  getAllTags(
    @Query('groupId') groupId: number = undefined,
  ) {
    return this.tagService.getAllTags(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/all/groups')
  getAllGroups() {
    return this.tagService.getAllGroups();
  }
}
